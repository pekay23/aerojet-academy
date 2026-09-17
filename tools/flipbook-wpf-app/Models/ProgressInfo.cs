using System;

namespace FlipbookWpfApp.Models;

public enum ScraperStatus
{
    Idle,
    Initializing,
    LoggingIn,
    Navigating,
    DetectingPages,
    Capturing,
    SavingPdf,
    Done,
    Error,
    Stopped
}

public class ProgressInfo
{
    public int CurrentPage { get; set; }
    public int TotalPages { get; set; }
    public ScraperStatus Status { get; set; } = ScraperStatus.Idle;
    public string Message { get; set; } = string.Empty;

    public double PercentComplete
    {
        get
        {
            if (TotalPages <= 0) return 0;
            var pct = (double)CurrentPage / TotalPages * 100.0;
            return Math.Clamp(pct, 0, 100);
        }
    }

    public string StatusText => Status switch
    {
        ScraperStatus.Idle => "Idle",
        ScraperStatus.Initializing => "Initializing browser...",
        ScraperStatus.LoggingIn => "Logging in...",
        ScraperStatus.Navigating => "Navigating to module...",
        ScraperStatus.DetectingPages => "Detecting total pages...",
        ScraperStatus.Capturing => "Capturing pages...",
        ScraperStatus.SavingPdf => "Saving PDF...",
        ScraperStatus.Done => "Done",
        ScraperStatus.Error => "Error",
        ScraperStatus.Stopped => "Stopped",
        _ => "Unknown"
    };
}
