const { execSync } = require("child_process");

class ProcessCleaner {
  constructor(port = 9000) {
    this.port = port;
    this.cleanupAttempts = 0;
    this.maxAttempts = 3;
  }

  // 查找占用指定端口的进程
  findProcessByPort() {
    try {
      if (process.platform === "win32") {
        const result = execSync(
          `netstat -ano | findstr :${this.port} | findstr LISTENING`,
          { encoding: "utf8" },
        );
        const lines = result
          .trim()
          .split("\n")
          .filter((line) => line.trim());

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(pid) && pid > 0) {
            return pid;
          }
        }
      } else {
        const result = execSync(`lsof -t -i:${this.port}`, {
          encoding: "utf8",
        });
        const pid = parseInt(result.trim(), 10);
        if (!isNaN(pid) && pid > 0) {
          return pid;
        }
      }
    } catch (error) {
      // 命令执行失败，端口可能未被占用
    }
    return null;
  }

  // 获取进程详细信息
  getProcessInfo(pid) {
    try {
      if (process.platform === "win32") {
        const result = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, {
          encoding: "utf8",
        });
        const lines = result
          .trim()
          .split("\n")
          .filter((line) => line.trim());
        if (lines.length > 0) {
          const parts = lines[0].split(",").map((p) => p.replace(/"/g, ""));
          return {
            name: parts[0],
            pid: pid,
            session: parts[2],
            memory: parts[4],
          };
        }
      } else {
        const result = execSync(`ps -p ${pid} -o pid,ppid,cmd,etime`, {
          encoding: "utf8",
        });
        const lines = result
          .trim()
          .split("\n")
          .filter((line) => line.trim());
        if (lines.length > 1) {
          const parts = lines[1].trim().split(/\s+/);
          return {
            pid: pid,
            ppid: parts[1],
            cmd: parts.slice(2).join(" "),
            time: parts[0],
          };
        }
      }
    } catch (error) {
      console.error(`获取进程 ${pid} 信息失败:`, error.message);
    }
    return null;
  }

  // 强制终止进程
  killProcess(pid) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "inherit" });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "inherit" });
      }
      console.log(`✅ 成功终止进程 ${pid}`);
      return true;
    } catch (error) {
      console.error(`❌ 终止进程 ${pid} 失败:`, error.message);
      return false;
    }
  }

  // 清理占用端口的进程
  cleanupPortProcess() {
    console.log(`🔍 正在检查端口 ${this.port} 占用情况...`);

    const pid = this.findProcessByPort();
    if (!pid) {
      console.log(`✅ 端口 ${this.port} 未被占用`);
      return true;
    }

    const processInfo = this.getProcessInfo(pid);
    if (processInfo) {
      console.log(`📝 发现占用进程:`);
      console.log(`   PID: ${pid}`);
      console.log(`   名称: ${processInfo.name || "未知"}`);
      console.log(`   内存: ${processInfo.memory || "未知"}`);
    } else {
      console.log(`📝 发现占用进程 PID: ${pid}`);
    }

    return this.killProcess(pid);
  }

  // 清理所有Node.js进程
  cleanupAllNodeProcesses() {
    console.log("🔍 正在检查所有Node.js进程...");

    try {
      if (process.platform === "win32") {
        const result = execSync(
          'tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH',
          { encoding: "utf8" },
        );
        const lines = result
          .trim()
          .split("\n")
          .filter((line) => line.trim() && line.includes("node.exe"));

        if (lines.length === 0) {
          console.log("✅ 没有发现Node.js进程");
          return;
        }

        console.log(`📝 发现 ${lines.length} 个Node.js进程:`);
        lines.forEach((line, index) => {
          const parts = line.split(",").map((p) => p.replace(/"/g, ""));
          console.log(
            `   ${index + 1}. ${parts[0]} (PID: ${parts[1]}, 内存: ${parts[4]} KB)`,
          );
        });

        console.log("\n🗑️  正在清理所有Node.js进程...");
        try {
          execSync("taskkill /F /IM node.exe", { stdio: "inherit" });
          console.log("✅ 成功清理所有Node.js进程");
        } catch (error) {
          console.error("❌ 清理Node.js进程失败:", error.message);
        }
      } else {
        // Linux/Mac
        try {
          const result = execSync("pgrep -f node", { encoding: "utf8" });
          const pids = result
            .trim()
            .split("\n")
            .filter((pid) => pid.trim());

          if (pids.length === 0) {
            console.log("✅ 没有发现Node.js进程");
            return;
          }

          console.log(
            `📝 发现 ${pids.length} 个Node.js进程: ${pids.join(", ")}`,
          );
          pids.forEach((pid) => this.killProcess(parseInt(pid, 10)));
        } catch (error) {
          console.log("✅ 没有发现Node.js进程");
        }
      }
    } catch (error) {
      console.log("✅ 没有发现Node.js进程");
    }
  }

  // 完整清理流程
  fullCleanup() {
    console.log("🚀 开始完整清理流程...\n");

    // 1. 清理指定端口
    const portClean = this.cleanupPortProcess();

    // 2. 等待短暂时间
    if (!portClean) {
      console.log("⏳ 等待1秒后重试...");
      setTimeout(() => {
        this.cleanupPortProcess();
      }, 1000);
    }

    // 3. 可选：清理所有Node进程
    const shouldCleanAll = process.argv.includes("--all");
    if (shouldCleanAll) {
      console.log("\n---");
      this.cleanupAllNodeProcesses();
    }

    console.log("\n✅ 清理流程完成！");
  }
}

// 主程序
if (require.main === module) {
  const cleaner = new ProcessCleaner(9000);

  const command = process.argv[2];
  switch (command) {
    case "port": {
      const port = parseInt(process.argv[3], 10) || 9000;
      cleaner.port = port;
      cleaner.cleanupPortProcess();
      break;
    }
    case "all":
      cleaner.cleanupAllNodeProcesses();
      break;
    case "full":
      cleaner.fullCleanup();
      break;
    default:
      console.log("使用方法:");
      console.log(
        "  node scripts/enhanced-cleanup.js port [端口号]  - 清理指定端口",
      );
      console.log(
        "  node scripts/enhanced-cleanup.js all             - 清理所有Node进程",
      );
      console.log(
        "  node scripts/enhanced-cleanup.js full [--all]    - 完整清理流程",
      );
      console.log("");
      console.log("示例:");
      console.log("  node scripts/enhanced-cleanup.js port 9000");
      console.log("  node scripts/enhanced-cleanup.js full --all");
      break;
  }
}

module.exports = ProcessCleaner;
