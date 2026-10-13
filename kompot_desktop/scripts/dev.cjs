const { spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

const root = path.join(__dirname, "..")
const electronPathFile = path.join(root, "node_modules", "electron", "path.txt")
const hasElectronBinary = fs.existsSync(electronPathFile)

const vite = spawn("npx", ["vite"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
})

if (!hasElectronBinary) {
  console.warn(
    "[kompot_desktop] Бинарник Electron не найден. Запущен только Vite: http://localhost:5173\n" +
      "Когда сеть позволит: npm run postinstall:electron && npm run dev"
  )
} else {
  const waitOn = spawn("npx", ["wait-on", "http://localhost:5173"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
  })

  waitOn.on("exit", (code) => {
    if (code !== 0) {
      vite.kill()
      process.exit(code || 1)
      return
    }
    const electron = spawn("npx", ["electron", "."], {
      cwd: root,
      shell: true,
      stdio: "inherit",
    })
    electron.on("exit", (electronCode) => {
      vite.kill()
      process.exit(electronCode || 0)
    })
  })
}

vite.on("exit", (code) => process.exit(code || 0))
