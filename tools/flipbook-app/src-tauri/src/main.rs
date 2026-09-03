use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};

struct ScrapeHandle(Mutex<Option<std::process::Child>>);

#[tauri::command]
async fn start_scrape(
    app: AppHandle,
    state: State<'_, ScrapeHandle>,
    url: String,
    username: String,
    password: String,
    pages: Option<u32>,
    output_dir: String,
    document_name: String,
    mode: String,
    images_only: bool,
    headless: bool,
    capture_method: Option<String>,
) -> Result<(), String> {
    let mut handle_guard = state.0.lock().map_err(|e| e.to_string())?;
    if handle_guard.is_some() {
        return Err("Scrape already running".to_string());
    }

    let workspace_root = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .parent()
        .ok_or("Cannot determine workspace root")?
        .to_path_buf();

    let scraper_path = workspace_root.join("tools").join("flipbook-scraper").join("index.ts");

    let mut cmd = Command::new("bun");
    cmd.arg("run")
        .arg(&scraper_path)
        .arg("--url")
        .arg(&url)
        .arg("--username")
        .arg(&username)
        .arg("--password")
        .arg(&password)
        .arg("--output")
        .arg(&output_dir)
        .arg("--name")
        .arg(&document_name)
        .arg("--headless")
        .arg(headless.to_string());

    if let Some(p) = pages {
        if p > 0 {
            cmd.arg("--pages").arg(p.to_string());
        }
    }

    if images_only {
        cmd.arg("--images-only");
    }

    if let Some(method) = capture_method {
        cmd.arg("--capture-method").arg(method);
    }

    if mode == "general" {
        cmd.arg("--config").arg("general-mode");
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn scraper: {}", e))?;

    let app_handle = app.clone();
    let stdout = child.stdout.take().expect("stdout was piped");

    std::thread::spawn(move || {
        use std::io::{BufRead, BufReader};
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                let _ = app_handle.emit("scrape-progress", line);
            }
        }
        let _ = app_handle.emit("scrape-complete", ());
    });

    *handle_guard = Some(child);

    drop(handle_guard);

    Ok(())
}

#[tauri::command]
async fn stop_scrape(
    state: State<'_, ScrapeHandle>,
) -> Result<(), String> {
    let mut handle_guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = handle_guard.take() {
        let _ = child.kill();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ScrapeHandle(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![start_scrape, stop_scrape])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
