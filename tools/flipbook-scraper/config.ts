export interface FlipbookConfig {
  baseUrl: string
  loginUrl: string
  username: string
  password: string
  moduleUrl: string
  outputDir: string
  documentName: string
  loginSelectors: {
    usernameField: string
    passwordField: string
    submitButton: string
  }
  flipbookSelectors: {
    container: string
    pageImage: string
    nextButton?: string
    prevButton?: string
    pageIndicator?: string
    totalPages?: string
  }
  pageLoadDelay: number
  headless: boolean
  imageFormat: 'png' | 'jpeg'
  captureMethod: 'interception' | 'screenshot'
  pdfOptions: {
    pageSize: 'a4' | 'letter' | 'fit'
    margin: number
  }
}

export const defaultConfig: Partial<FlipbookConfig> = {
  pageLoadDelay: 2000,
  headless: true,
  imageFormat: 'jpeg',
  captureMethod: 'interception',
  pdfOptions: {
    pageSize: 'a4',
    margin: 0,
  },
}
