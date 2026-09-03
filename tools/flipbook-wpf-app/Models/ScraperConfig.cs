using System;
using System.Collections.Generic;

namespace FlipbookWpfApp.Models;

public enum CaptureMethod
{
    Screenshot,
    ImageInterception
}

public enum PageSize
{
    A4,
    Letter,
    Fit
}

public enum NavigationMethod
{
    ArrowKeys,
    NextButtonClick
}

public class ScraperConfig
{
    public string BaseUrl { get; set; } = string.Empty;
    public string LoginUrl { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool LoginRequired { get; set; } = true;
    public string ModuleUrl { get; set; } = string.Empty;
    public string OutputDir { get; set; } = string.Empty;
    public string DocumentName { get; set; } = "Flipbook";
    public int PageCount { get; set; } = 0;
    public int PageLoadDelayMs { get; set; } = 2000;
    public bool Headless { get; set; } = true;
    public string ImageFormat { get; set; } = "jpeg";
    public CaptureMethod CaptureMethod { get; set; } = CaptureMethod.ImageInterception;
    public PageSize PdfPageSize { get; set; } = PageSize.Fit;
    public int PdfMargin { get; set; } = 0;
    public NavigationMethod Navigation { get; set; } = NavigationMethod.ArrowKeys;

    public LoginSelectors LoginSelectors { get; set; } = new();
    public FlipbookSelectors FlipbookSelectors { get; set; } = new();
}

public class LoginSelectors
{
    public string UsernameField { get; set; } = "input[name='username']";
    public string PasswordField { get; set; } = "input[name='password']";
    public string SubmitButton { get; set; } = "button[type='submit']";
}

public class FlipbookSelectors
{
    public string Container { get; set; } = ".flipbook-container";
    public string PageImage { get; set; } = ".flipbook img";
    public string? NextButton { get; set; } = ".next-page";
    public string? PrevButton { get; set; } = ".prev-page";
    public string? PageIndicator { get; set; } = ".page-count";
    public string? TotalPages { get; set; } = ".total-pages";
}
