using FlipbookWpfApp.Models;

namespace FlipbookWpfApp.Services;

public static class SuntechPreset
{
    public const string BaseUrl = "https://courses.suntech-bc.com";
    public const string LoginUrl = "https://courses.suntech-bc.com/login";

    public static ScraperConfig CreateDefault()
    {
        return new ScraperConfig
        {
            BaseUrl = BaseUrl,
            LoginUrl = LoginUrl,
            LoginRequired = true,
            PageLoadDelayMs = 4000,
            Headless = true,
            ImageFormat = "jpeg",
            CaptureMethod = CaptureMethod.ImageInterception,
            PdfPageSize = PageSize.Fit,
            PdfMargin = 0,
            Navigation = NavigationMethod.ArrowKeys,
            LoginSelectors = new LoginSelectors
            {
                UsernameField = "input[name='log']",
                PasswordField = "input[name='pwd']",
                SubmitButton = "input.wp-submit, button.accessally-login-form-submit-button"
            },
            FlipbookSelectors = new FlipbookSelectors
            {
                Container = ".flipbook-main-wrapper",
                PageImage = ".book img, .flipbook-main-wrapper img, .book-page img, .turn-page img",
                NextButton = ".flipbook-next, .next-button, [class*='next'], .flipbook-nav-next",
                PrevButton = ".flipbook-prev, .prev-button, [class*='prev'], .flipbook-nav-prev",
                PageIndicator = ".flipbook-page-count, .page-info, [class*='page-count']",
                TotalPages = ".flipbook-total-pages, [class*='total-pages']"
            }
        };
    }
}
