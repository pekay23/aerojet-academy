using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Forms;
using FlipbookWpfApp.Models;
using FlipbookWpfApp.Services;

namespace FlipbookWpfApp;

public partial class MainWindow : Window
{
    private CancellationTokenSource? _cts;
    private FlipbookScraper? _scraper;
    private bool _isRunning;

    public bool IsRunning
    {
        get => _isRunning;
        set
        {
            _isRunning = value;
            StartButton.IsEnabled = !value;
            StopButton.IsEnabled = value;
        }
    }

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
    }

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        // Default output dir = Documents\FlipbookScraper
        var defaultOut = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "FlipbookScraper");
        Directory.CreateDirectory(defaultOut);
        SuntechOutputDir.Text = defaultOut;
        GeneralOutputDir.Text = defaultOut;
    }

    private void ModeChanged(object sender, RoutedEventArgs e)
    {
        if (SuntechTab.IsChecked == true)
        {
            SuntechPanel.Visibility = Visibility.Visible;
            GeneralPanel.Visibility = Visibility.Collapsed;
        }
        else
        {
            SuntechPanel.Visibility = Visibility.Collapsed;
            GeneralPanel.Visibility = Visibility.Visible;
        }
    }

    private void BrowseOutputDir_Click(object sender, RoutedEventArgs e)
    {
        using var dlg = new FolderBrowserDialog
        {
            Description = "Select output directory",
            UseDescriptionForTitle = true,
            ShowNewFolderButton = true,
            InitialDirectory = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments)
        };

        if (dlg.ShowDialog() == System.Windows.Forms.DialogResult.OK)
        {
            // Determine which panel invoked the picker
            if (SuntechTab.IsChecked == true)
                SuntechOutputDir.Text = dlg.SelectedPath;
            else
                GeneralOutputDir.Text = dlg.SelectedPath;
        }
    }

    private ScraperConfig? BuildConfig()
    {
        try
        {
            if (SuntechTab.IsChecked == true)
            {
                var cfg = SuntechPreset.CreateDefault();
                cfg.ModuleUrl = SuntechModuleUrl.Text.Trim();
                cfg.Username = SuntechUsername.Text.Trim();
                cfg.Password = SuntechPassword.Password;
                cfg.PageCount = int.TryParse(SuntechPageCount.Text, out var pc) ? pc : 0;
                cfg.PageLoadDelayMs = int.TryParse(SuntechDelay.Text, out var d) ? d : 4000;
                cfg.DocumentName = string.IsNullOrWhiteSpace(SuntechDocumentName.Text) ? "Suntech-Flipbook" : SuntechDocumentName.Text.Trim();
                cfg.OutputDir = SuntechOutputDir.Text.Trim();
                cfg.Headless = SuntechHeadless.IsChecked == true;
                cfg.CaptureMethod = (SuntechCaptureMethod.SelectedIndex == 1)
                    ? CaptureMethod.Screenshot
                    : CaptureMethod.ImageInterception;
                return ValidateConfig(cfg);
            }
            else
            {
                var cfg = new ScraperConfig
                {
                    ModuleUrl = GeneralModuleUrl.Text.Trim(),
                    LoginRequired = GeneralLoginRequired.IsChecked == true,
                    LoginUrl = GeneralLoginUrl.Text.Trim(),
                    Username = GeneralUsername.Text.Trim(),
                    Password = GeneralPassword.Password,
                    LoginSelectors = new LoginSelectors
                    {
                        UsernameField = GeneralUserSelector.Text.Trim(),
                        PasswordField = GeneralPassSelector.Text.Trim(),
                        SubmitButton = GeneralSubmitSelector.Text.Trim()
                    },
                    FlipbookSelectors = new FlipbookSelectors
                    {
                        PageImage = GeneralImageSelector.Text.Trim(),
                        Container = GeneralContainerSelector.Text.Trim(),
                        NextButton = GeneralNextSelector.Text.Trim()
                    },
                    Navigation = (GeneralNavMethod.SelectedIndex == 1)
                        ? NavigationMethod.NextButtonClick
                        : NavigationMethod.ArrowKeys,
                    CaptureMethod = (GeneralCaptureMethod.SelectedIndex == 1)
                        ? CaptureMethod.Screenshot
                        : CaptureMethod.ImageInterception,
                    PageCount = int.TryParse(GeneralPageCount.Text, out var pc2) ? pc2 : 0,
                    PageLoadDelayMs = int.TryParse(GeneralDelay.Text, out var d2) ? d2 : 2000,
                    DocumentName = string.IsNullOrWhiteSpace(GeneralDocumentName.Text) ? "Flipbook-Export" : GeneralDocumentName.Text.Trim(),
                    OutputDir = GeneralOutputDir.Text.Trim(),
                    ImageFormat = GeneralImageFormat.SelectedIndex == 1 ? "png" : "jpeg",
                    Headless = GeneralHeadless.IsChecked == true,
                    PdfPageSize = GeneralPageSize.SelectedIndex switch
                    {
                        1 => PageSize.A4,
                        2 => PageSize.Letter,
                        _ => PageSize.Fit
                    }
                };
                return ValidateConfig(cfg);
            }
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show(this, ex.Message, "Invalid configuration",
                System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Warning);
            return null;
        }
    }

    private ScraperConfig ValidateConfig(ScraperConfig cfg)
    {
        if (string.IsNullOrWhiteSpace(cfg.ModuleUrl))
            throw new InvalidOperationException("Module/Target URL is required.");
        if (string.IsNullOrWhiteSpace(cfg.OutputDir))
            throw new InvalidOperationException("Output directory is required.");
        if (cfg.LoginRequired && string.IsNullOrWhiteSpace(cfg.Username))
            throw new InvalidOperationException("Username is required when login is enabled.");
        if (cfg.PageLoadDelayMs < 100)
            cfg.PageLoadDelayMs = 100;
        if (cfg.PageCount < 0) cfg.PageCount = 0;
        Directory.CreateDirectory(cfg.OutputDir);
        return cfg;
    }

    private void AppendLog(string line)
    {
        var stamp = DateTime.Now.ToString("HH:mm:ss");
        LogText.Text = $"[{stamp}] {line}\n{LogText.Text}";
    }

    private void UpdateUi(ProgressInfo p)
    {
        StatusText.Text = p.StatusText;
        CurrentPageText.Text = $"{p.CurrentPage} / {p.TotalPages}";
        ProgressBar.Value = p.PercentComplete;
        if (!string.IsNullOrEmpty(p.Message))
        {
            AppendLog(p.Message);
        }
    }

    private async void Start_Click(object sender, RoutedEventArgs e)
    {
        var cfg = BuildConfig();
        if (cfg == null) return;

        IsRunning = true;
        LogText.Text = string.Empty;
        ProgressBar.Value = 0;
        FooterText.Text = "Running...";
        _cts = new CancellationTokenSource();

        var progress = new Progress<ProgressInfo>(UpdateUi);
        _scraper = new FlipbookScraper(cfg, progress, _cts.Token);

        try
        {
            // Run on a background thread to keep UI responsive
            await Task.Run(async () => await _scraper.RunAsync(), _cts.Token);
        }
        catch (OperationCanceledException)
        {
            AppendLog("Cancelled.");
        }
        catch (Exception ex)
        {
            AppendLog($"Error: {ex.Message}");
            System.Windows.MessageBox.Show(this, ex.Message, "Scraper error",
                System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Error);
        }
        finally
        {
            IsRunning = false;
            FooterText.Text = "Ready.";
        }
    }

    private void Stop_Click(object sender, RoutedEventArgs e)
    {
        _scraper?.RequestStop();
        _cts?.Cancel();
        FooterText.Text = "Stopping...";
    }

    private void OpenOutput_Click(object sender, RoutedEventArgs e)
    {
        var dir = SuntechTab.IsChecked == true
            ? SuntechOutputDir.Text
            : GeneralOutputDir.Text;
        if (string.IsNullOrWhiteSpace(dir) || !Directory.Exists(dir))
        {
            System.Windows.MessageBox.Show(this, "Output directory does not exist yet.",
                "No folder", System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Information);
            return;
        }
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = dir,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            System.Windows.MessageBox.Show(this, ex.Message, "Could not open folder",
                System.Windows.MessageBoxButton.OK, System.Windows.MessageBoxImage.Warning);
        }
    }

    protected override void OnClosed(EventArgs e)
    {
        try
        {
            _scraper?.RequestStop();
            _cts?.Cancel();
        }
        catch { }
        base.OnClosed(e);
    }
}
