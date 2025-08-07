const { execSync } = require("child_process");
const path = require("path");

function findProcessByPort(port) {
  try {
    if (process.platform === "win32") {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.split('\n').filter(line => line.trim());
      const listening = lines.find(line => line.includes('LISTENING'));
      if (listening) {
        const pid = listening.trim().split(/\s+/).pop();
        return parseInt(pid, 10);
      }
    }
  } catch (e) {
    console.log(`端口 ${port} 未被占用`);
  }
  return null;
}

function killProcess(pid) {
  try {
    if (process.platform === "win32") {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
        console.log(`成功终止进程 ${pid}`);
      } catch (e) {
        console.log(`终止进程 ${pid} 失败:`, e.message);
      }
    } else {
      try {
        process.kill(pid, 'SIGKILL');
        console.log(`成功终止进程 ${pid}`);
      } catch (e) {
        console.log(`终止进程 ${pid} 失败:`, e.message);
      }
    }
  } catch (e) {
    console.log(`终止进程时出错:`, e.message);
  }
}

function cleanupPort(port = 9000) {
  console.log(`开始清理端口 ${port}...`);
  const pid = findProcessByPort(port);
  if (pid) {
    console.log(`发现占用端口 ${port} 的进程: PID ${pid}`);
    killProcess(pid);
  } else {
    console.log(`端口 ${port} 当前未被占用`);
  }
}

function cleanupAllNodeProcesses() {
  console.log("开始清理所有node进程...");
  try {
    if (process.platform === "win32") {
      try {
        execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
        console.log("成功清理所有node进程");
      } catch (e) {
        console.log("清理node进程时出错:", e.message);
      }
    }
  } catch (e) {
    console.log("清理进程时出错:", e.message);
  }
}

const command = process.argv[2];
if (command === 'port') {
  const port = process.argv[3] || 9000;
  cleanupPort(port);
} else if (command === 'all') {
  cleanupAllNodeProcesses();
} else {
  console.log("使用方法:");
  console.log("  node scripts/cleanup.js port [端口号]  - 清理指定端口");
  console.log("  node scripts/cleanup.js all              - 清理所有node进程");
}