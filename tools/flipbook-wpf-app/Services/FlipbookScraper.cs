using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FlipbookWpfApp.Models;
using Microsoft.Playwright;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using PdfPageSize = PdfSharpCore.PageSize;

namespace FlipbookWpfApp.Services;

public class FlipbookScraper
{
    private readonly ScraperConfig _config;
    private readonly IProgress<ProgressInfo> _progress;
    private readonly CancellationToken _cancellationToken;

    private IPlaywright? _playwright;
    private IBrowser? _browser;
    private IBrowserContext? _context;
    private IPage? _page;

    private readonly List<string> _capturedImages = new();
    private readonly Dictionary<string, byte[]> _interceptedImages = new();
    private bool _isStopped;

    public FlipbookScraper(ScraperConfig config, IProgress<ProgressInfo> progress, CancellationToken cancellationToken)
    {
        _config = config;
        _progress = progress;
        _cancellationToken = cancellationToken;
    }

    public void RequestStop() => _isStopped = true;

    private void Report(ScraperStatus status, string message, int currentPage = 0, int totalPages = 0)
    {
        _progress.Report(new ProgressInfo
        {
            Status = status,
            Message = message,
            CurrentPage = currentPage,
            TotalPages = totalPages
        });
    }

    public async Task<string> RunAsync()
    {
        try
        {
            await InitializeAsync();
            await NavigateToModuleAsync();
            int totalPages = await DetectTotalPagesAsync();

            if (totalPages <= 0)
            {
                totalPages = _config.PageCount;
                Report(ScraperStatus.DetectingPages, $"Using configured page count: {totalPages}", 0, totalPages);
            }
            else
            {
                Report(ScraperStatus.DetectingPages, $"Detected {totalPages} pages", 0, totalPages);
            }

            if (totalPages <= 0)
            {
                throw new InvalidOperationException("No pages detected. Please set Page Count manually.");
            }

            await CaptureAllPagesAsync(totalPages);

            if (_isStopped)
            {
                Report(ScraperStatus.Stopped, "Scraping stopped by user.", totalPages, totalPages);
                return string.Empty;
            }

            string pdfPath = await SaveAsPdfAsync();
            Report(ScraperStatus.Done, $"Complete! PDF: {pdfPath}", totalPages, totalPages);
            return pdfPath;
        }
        catch (OperationCanceledException)
        {
            Report(ScraperStatus.Stopped, "Scraping cancelled.", 0, 0);
            return string.Empty;
        }
        catch (Exception ex)
        {
            Report(ScraperStatus.Error, $"Error: {ex.Message}", 0, 0);
            throw;
        }
        finally
        {
            await CleanupAsync();
        }
    }

    public async Task InitializeAsync()
    {
        Report(ScraperStatus.Initializing, "Launching browser...");

        _playwright = await Playwright.CreateAsync();
        _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = _config.Headless,
            Args = new[]
            {
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--ignore-certificate-errors"
            }
        });

        _context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = 1920, Height = 1080 },
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            AcceptDownloads = true,
            IgnoreHTTPSErrors = true
        });

        _page = await _context.NewPageAsync();
        await SetupImageInterceptionAsync();

        Report(ScraperStatus.Initializing, "Browser ready.");
    }

    private async Task SetupImageInterceptionAsync()
    {
        if (_context == null) return;

        await _context.RouteAsync("**/*.{jpg,jpeg,png,webp}", async route =>
        {
            try
            {
                var response = await route.FetchAsync();
                var buffer = await response.BodyAsync();
                var url = route.Request.Url;
                if (!url.Contains("spinner", StringComparison.OrdinalIgnoreCase) &&
                    !url.Contains("logo", StringComparison.OrdinalIgnoreCase))
                {
                    lock (_interceptedImages)
                    {
                        _interceptedImages[url] = buffer;
                    }
                }
            }
            catch
            {
                // ignore fetch failures
            }
            await route.ContinueAsync();
        });
    }

    public async Task LoginAsync()
    {
        if (_page == null) throw new InvalidOperationException("Browser not initialized");
        if (!_config.LoginRequired) return;

        Report(ScraperStatus.LoggingIn, "Navigating to login page...");

        await _page.GotoAsync(_config.LoginUrl, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.DOMContentLoaded,
            Timeout = 60000
        });

        await _page.WaitForSelectorAsync(_config.LoginSelectors.UsernameField, new PageWaitForSelectorOptions
        {
            State = WaitForSelectorState.Visible,
            Timeout = 15000
        });
        await _page.WaitForTimeoutAsync(1000);

        await _page.FillAsync(_config.LoginSelectors.UsernameField, _config.Username);
        await _page.FillAsync(_config.LoginSelectors.PasswordField, _config.Password);

        await _page.WaitForTimeoutAsync(500);

        // Use Enter to submit (works with Accessally forms); also try submit button as fallback
        await _page.Keyboard.PressAsync("Enter");

        try
        {
            // Try submitting via the configured submit selector first
            if (!string.IsNullOrWhiteSpace(_config.LoginSelectors.SubmitButton))
            {
                await _page.RunAndWaitForNavigationAsync(
                    async () => await _page.ClickAsync(_config.LoginSelectors.SubmitButton, new PageClickOptions { Timeout = 5000 }),
                    new PageRunAndWaitForNavigationOptions
                    {
                        WaitUntil = WaitUntilState.NetworkIdle,
                        Timeout = 20000
                    });
            }
            else
            {
                await _page.RunAndWaitForNavigationAsync(
                    async () => await _page.Keyboard.PressAsync("Enter"),
                    new PageRunAndWaitForNavigationOptions
                    {
                        WaitUntil = WaitUntilState.NetworkIdle,
                        Timeout = 20000
                    });
            }
        }
        catch
        {
            // ignore navigation timeout - we may already be logged in
        }

        await _page.WaitForTimeoutAsync(2000);

        Report(ScraperStatus.LoggingIn, $"Login complete - now at {_page.Url}");
    }

    public async Task NavigateToModuleAsync()
    {
        if (_page == null) throw new InvalidOperationException("Browser not initialized");

        await LoginAsync();

        Report(ScraperStatus.Navigating, "Navigating to module...");
        await _page.GotoAsync(_config.ModuleUrl, new PageGotoOptions
        {
            WaitUntil = WaitUntilState.DOMContentLoaded,
            Timeout = 60000
        });

        // Wait for flipbook to initialise - up to 45s
        Report(ScraperStatus.Navigating, "Waiting for flipbook to load (this can take 45s)...");
        await _page.WaitForTimeoutAsync(Math.Max(_config.PageLoadDelayMs, 1000));
    }

    public async Task<int> DetectTotalPagesAsync()
    {
        if (_page == null) throw new InvalidOperationException("Browser not initialized");

        Report(ScraperStatus.DetectingPages, "Detecting total pages...");

        // Strategy 1: window.FLIPBOOK globals
        var jsCount = await _page.EvaluateAsync<int>(@"() => {
            const w = window;
            if (w.FLIPBOOK) {
                const keys = Object.keys(w.FLIPBOOK);
                for (const key of keys) {
                    const fb = w.FLIPBOOK[key];
                    if (fb?.options?.pages?.length) return fb.options.pages.length;
                    if (fb?.totalPages) return fb.totalPages;
                    if (fb?.pages?.length) return fb.pages.length;
                }
            }
            return 0;
        }");

        if (jsCount > 0) return jsCount;

        // Strategy 2: "X / Y" pattern - pick the largest Y
        var bodyText = await _page.EvaluateAsync<string>("() => document.body?.innerText || ''");
        var matches = System.Text.RegularExpressions.Regex.Matches(bodyText, @"(\d+)\s*\/\s*(\d+)");
        if (matches.Count > 0)
        {
            int maxTotal = 0;
            foreach (System.Text.RegularExpressions.Match m in matches)
            {
                if (m.Groups.Count >= 3 && int.TryParse(m.Groups[2].Value, out int total))
                {
                    if (total > maxTotal && total < 10000) maxTotal = total;
                }
            }
            if (maxTotal > 10) return maxTotal;
        }

        // Strategy 3: explicit selectors
        if (!string.IsNullOrEmpty(_config.FlipbookSelectors.TotalPages))
        {
            try
            {
                var el = await _page.QuerySelectorAsync(_config.FlipbookSelectors.TotalPages);
                if (el != null)
                {
                    var text = await el.TextContentAsync();
                    if (int.TryParse(text?.Trim(), out int n) && n > 0) return n;
                }
            }
            catch { }
        }

        // Strategy 4: navigation fallback - press ArrowRight many times then read indicator
        Report(ScraperStatus.DetectingPages, "Using navigation fallback to count pages...");
        for (int i = 0; i < 500; i++)
        {
            if (_isStopped) break;
            await _page.Keyboard.PressAsync("ArrowRight");
            await _page.WaitForTimeoutAsync(100);
        }
        await _page.WaitForTimeoutAsync(1000);

        var finalText = await _page.EvaluateAsync<string>("() => document.body?.innerText || ''");
        var finalMatch = System.Text.RegularExpressions.Regex.Match(finalText, @"(\d+)\s*\/\s*(\d+)");
        if (finalMatch.Success && finalMatch.Groups.Count >= 3)
        {
            if (int.TryParse(finalMatch.Groups[2].Value, out int total) && total > 10 && total < 10000)
            {
                return total;
            }
        }

        return 0;
    }

    public async Task CaptureAllPagesAsync(int totalPages, int startPage = 1)
    {
        if (_page == null) throw new InvalidOperationException("Browser not initialized");

        var outputFolder = Path.Combine(_config.OutputDir, _config.DocumentName);
        Directory.CreateDirectory(outputFolder);

        _capturedImages.Clear();

        // Navigate back to page 1 by pressing ArrowLeft many times
        for (int i = 0; i < totalPages + 10; i++)
        {
            if (_isStopped) break;
            await _page.Keyboard.PressAsync("ArrowLeft");
            await _page.WaitForTimeoutAsync(50);
        }
        await _page.WaitForTimeoutAsync(1000);

        // Navigate to start page if not starting from page 1
        if (startPage > 1)
        {
            for (int i = 0; i < startPage - 1; i++)
            {
                if (_isStopped) break;
                await _page.Keyboard.PressAsync("ArrowRight");
                await _page.WaitForTimeoutAsync(50);
            }
            await _page.WaitForTimeoutAsync(1000);
        }

        for (int i = startPage; i <= totalPages; i++)
        {
            if (_isStopped) break;
            _cancellationToken.ThrowIfCancellationRequested();

            Report(ScraperStatus.Capturing, $"Capturing page {i} of {totalPages}", i, totalPages);

            // Clear intercepted images before page renders the next one
            lock (_interceptedImages)
            {
                _interceptedImages.Clear();
            }

            // Wait for new images to be intercepted
            await _page.WaitForTimeoutAsync(Math.Max(1500, _config.PageLoadDelayMs));

            string? currentImgSrc = null;
            if (_config.CaptureMethod == CaptureMethod.ImageInterception)
            {
                currentImgSrc = await _page.EvaluateAsync<string?>(@"() => {
                    const imgs = Array.from(document.querySelectorAll('.book img, .flipbook-main-wrapper img, .flipbook-container img'));
                    const visible = imgs.find(img => {
                        const rect = img.getBoundingClientRect();
                        return rect.width > 100 && rect.height > 100 && !img.src.includes('spinner');
                    });
                    return visible?.src || null;
                }");
            }

            byte[]? imageBuffer = null;
            if (_config.CaptureMethod == CaptureMethod.ImageInterception && currentImgSrc != null)
            {
                imageBuffer = FindInterceptedImage(currentImgSrc);
            }

            // Fallback: largest intercepted image
            if (imageBuffer == null && _config.CaptureMethod == CaptureMethod.ImageInterception)
            {
                lock (_interceptedImages)
                {
                    byte[]? best = null;
                    int bestSize = 0;
                    foreach (var kv in _interceptedImages)
                    {
                        if (kv.Value.Length > bestSize && kv.Value.Length > 10000)
                        {
                            bestSize = kv.Value.Length;
                            best = kv.Value;
                        }
                    }
                    imageBuffer = best;
                }
            }

            var filename = $"page_{i.ToString("D4")}.{_config.ImageFormat}";
            var filepath = Path.Combine(outputFolder, filename);

            if (imageBuffer != null)
            {
                await File.WriteAllBytesAsync(filepath, imageBuffer, _cancellationToken);
            }
            else
            {
                // Screenshot fallback
                string? containerSelector = _config.FlipbookSelectors.Container;
                IElementHandle? flipbookEl = null;
                if (!string.IsNullOrEmpty(containerSelector))
                {
                    try
                    {
                        flipbookEl = await _page.QuerySelectorAsync(containerSelector);
                    }
                    catch { }
                }

                if (flipbookEl != null)
                {
                    await flipbookEl.ScreenshotAsync(new ElementHandleScreenshotOptions
                    {
                        Path = filepath,
                        Type = ScreenshotType.Jpeg,
                        Quality = 90
                    });
                }
                else
                {
                    await _page.ScreenshotAsync(new PageScreenshotOptions
                    {
                        Path = filepath,
                        Type = ScreenshotType.Jpeg,
                        Quality = 90,
                        FullPage = false
                    });
                }
            }

            _capturedImages.Add(filepath);

            if (i < totalPages && !_isStopped)
            {
                if (_config.Navigation == NavigationMethod.ArrowKeys)
                {
                    await _page.Keyboard.PressAsync("ArrowRight");
                }
                else if (!string.IsNullOrEmpty(_config.FlipbookSelectors.NextButton))
                {
                    try
                    {
                        await _page.ClickAsync(_config.FlipbookSelectors.NextButton, new PageClickOptions
                        {
                            Timeout = 3000
                        });
                    }
                    catch
                    {
                        await _page.Keyboard.PressAsync("ArrowRight");
                    }
                }
                else
                {
                    await _page.Keyboard.PressAsync("ArrowRight");
                }
                await _page.WaitForTimeoutAsync(600);
            }
        }

        Report(ScraperStatus.Capturing,
            $"Captured {_capturedImages.Count} of {totalPages} pages",
            _capturedImages.Count, totalPages);
    }

    private byte[]? FindInterceptedImage(string src)
    {
        lock (_interceptedImages)
        {
            if (_interceptedImages.TryGetValue(src, out var exact))
            {
                return exact;
            }

            var srcFileName = src.Split('/').LastOrDefault() ?? string.Empty;
            foreach (var kv in _interceptedImages)
            {
                if (kv.Key == src || kv.Key.EndsWith(srcFileName, StringComparison.OrdinalIgnoreCase))
                {
                    return kv.Value;
                }
            }
        }
        return null;
    }

    public async Task<string> SaveAsPdfAsync()
    {
        Report(ScraperStatus.SavingPdf, "Converting images to PDF...");

        if (_capturedImages.Count == 0)
        {
            throw new InvalidOperationException("No images to convert");
        }

        var outputPath = Path.Combine(_config.OutputDir, $"{_config.DocumentName}.pdf");

        using var document = new PdfDocument();

        for (int i = 0; i < _capturedImages.Count; i++)
        {
            var imgPath = _capturedImages[i];
            XImage? image = null;
            try
            {
                image = XImage.FromFile(imgPath);
            }
            catch
            {
                continue;
            }

            var page = document.AddPage();
            if (_config.PdfPageSize == PageSize.A4)
            {
                page.Size = PdfSharpCore.PageSize.A4;
            }
            else if (_config.PdfPageSize == PageSize.Letter)
            {
                page.Size = PdfSharpCore.PageSize.Letter;
            }
            else
            {
                // Fit to image - point units
                page.Size = PdfSharpCore.PageSize.A4; // placeholder, overridden below
                page.Width = image.PixelWidth;
                page.Height = image.PixelHeight;
            }

            using var gfx = XGraphics.FromPdfPage(page);
            double drawWidth, drawHeight, drawX, drawY;

            if (_config.PdfPageSize == PageSize.Fit)
            {
                drawWidth = image.PixelWidth;
                drawHeight = image.PixelHeight;
                drawX = 0;
                drawY = 0;
            }
            else
            {
                double pageWidth = page.Width;
                double pageHeight = page.Height;
                double margin = _config.PdfMargin;
                double availW = pageWidth - 2 * margin;
                double availH = pageHeight - 2 * margin;
                double imgAspect = (double)image.PixelWidth / image.PixelHeight;
                double availAspect = availW / availH;

                if (imgAspect > availAspect)
                {
                    drawWidth = availW;
                    drawHeight = availW / imgAspect;
                }
                else
                {
                    drawHeight = availH;
                    drawWidth = availH * imgAspect;
                }
                drawX = margin + (availW - drawWidth) / 2;
                drawY = margin + (availH - drawHeight) / 2;
            }

            gfx.DrawImage(image, drawX, drawY, drawWidth, drawHeight);

            image.Dispose();

            if (i % 5 == 0)
            {
                Report(ScraperStatus.SavingPdf, $"Converting image {i + 1} of {_capturedImages.Count}",
                    i + 1, _capturedImages.Count);
                await Task.Yield();
            }
        }

        await Task.Run(() => document.Save(outputPath), _cancellationToken);

        Report(ScraperStatus.SavingPdf, $"PDF saved: {outputPath}");
        return outputPath;
    }

    public async Task CleanupAsync()
    {
        try
        {
            if (_context != null) await _context.CloseAsync();
            if (_browser != null) await _browser.CloseAsync();
            _playwright?.Dispose();
        }
        catch
        {
            // best effort
        }
        finally
        {
            _context = null;
            _browser = null;
            _page = null;
            _playwright = null;
            lock (_interceptedImages)
            {
                _interceptedImages.Clear();
            }
        }
    }

    public IReadOnlyList<string> GetCapturedImages() => _capturedImages.AsReadOnly();
}
