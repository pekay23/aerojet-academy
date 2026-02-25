import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicDir = path.join(__dirname, 'public')
const sourceDirs = [
  path.join(__dirname, 'app'),
  path.join(__dirname, 'components'),
  path.join(__dirname, 'lib'),
]

// Folders to exclude from conversion (e.g., user uploads)
const excludeDirs = [path.join(publicDir, 'uploads')]

function shouldExclude(filePath) {
  return excludeDirs.some((excludeDir) => filePath.startsWith(excludeDir))
}

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function (file) {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      if (!shouldExclude(fullPath)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles)
      }
    } else {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

async function convertAndReplace() {
  const allPublicFiles = getAllFiles(publicDir)
  const imageFiles = allPublicFiles.filter((file) => /\.(jpg|jpeg|png)$/i.test(file))

  const conversions = []

  console.log(`Found ${imageFiles.length} images to convert.`)

  for (const file of imageFiles) {
    const ext = path.extname(file)
    const basename = path.basename(file, ext)
    const dir = path.dirname(file)
    const webpPath = path.join(dir, `${basename}.webp`)

    try {
      if (!fs.existsSync(webpPath)) {
        await sharp(file).webp({ quality: 80 }).toFile(webpPath)
        console.log(`Converted: ${file} -> ${webpPath}`)
      } else {
        console.log(`WebP already exists: ${webpPath}`)
      }

      const oldRelativePath = file.substring(publicDir.length).replace(/\\/g, '/')
      const newRelativePath = webpPath.substring(publicDir.length).replace(/\\/g, '/')

      const oldFileName = path.basename(file)
      const newFileName = path.basename(webpPath)

      conversions.push({
        oldFilePath: file,
        newFilePath: webpPath,
        oldRelativePath,
        newRelativePath,
        oldFileName,
        newFileName,
      })
    } catch (err) {
      console.error(`Error converting ${file}:`, err)
    }
  }

  // Now search and replace in the codebase
  console.log('Replacing references in the codebase...')
  let totalReplaced = 0

  function processSourceFiles(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        processSourceFiles(fullPath)
      } else if (/\.(tsx|ts|jsx|js|css|json|md)$/i.test(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8')
        let originalContent = content
        let fileChanged = false

        for (const conv of conversions) {
          // Replace by exact relative path first (e.g. /images/hero/pilot.jpg -> /images/hero/pilot.webp)
          const regexRelative = new RegExp(conv.oldRelativePath.replace(/\./g, '\\.'), 'gi')
          if (regexRelative.test(content)) {
            content = content.replace(regexRelative, conv.newRelativePath)
            fileChanged = true
          }

          // Replace by filename (e.g. pilot.jpg -> pilot.webp)
          // Be careful not to replace part of another filename, use word boundaries
          const regexName = new RegExp(
            `(?<=['"\`\\/\\\\])${conv.oldFileName.replace(/\./g, '\\.')}(?=['"\`\\?\\#])`,
            'gi'
          )
          if (regexName.test(content)) {
            content = content.replace(regexName, conv.newFileName)
            fileChanged = true
          }
        }

        if (fileChanged) {
          fs.writeFileSync(fullPath, content, 'utf8')
          console.log(`Updated references in: ${fullPath}`)
          totalReplaced++
        }
      }
    }
  }

  for (const srcDir of sourceDirs) {
    if (fs.existsSync(srcDir)) {
      processSourceFiles(srcDir)
    }
  }

  console.log(`Completed replacements in ${totalReplaced} files.`)

  // Delete old files
  console.log('Deleting old image files...')
  for (const conv of conversions) {
    if (fs.existsSync(conv.oldFilePath) && fs.existsSync(conv.newFilePath)) {
      fs.unlinkSync(conv.oldFilePath)
      console.log(`Deleted: ${conv.oldFilePath}`)
    }
  }
}

convertAndReplace().catch(console.error)
