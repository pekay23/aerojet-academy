export interface ScrapeConfig {
  url: string
  username: string
  password: string
  pages: number
  outputDir: string
  documentName: string
  captureMethod: 'screenshot' | 'interception'
  headless: boolean
  imagesOnly: boolean
}

export interface GeneralScrapeConfig extends ScrapeConfig {
  loginUrl: string
  usernameField: string
  passwordField: string
  submitMethod: 'enter' | 'click'
  submitSelector: string
  navigationMethod: 'arrow' | 'click'
  nextSelector: string
  prevSelector: string
  imageSelector: string
}

export interface ProgressState {
  status: string
  currentPage: number
  totalPages: number | null
  message: string
}
