/* eslint-disable no-console */
/* eslint-disable import/extensions */
import {
  existsSync, readdirSync, statSync, readFileSync,
} from 'fs';
import { fileURLToPath, URL } from 'url';
import JSON5 from 'json5';

/**
 * 由相对路径获取绝对路径
 * @param {string} filePath 相对路径
 * @returns 绝对路径
 */
export function getAbsoluteFilePath(filePath) {
  return fileURLToPath(new URL(filePath, import.meta.url));
}

/**
 * 获取运行的mode
 * @param {array} argvs 脚本参数
 * @param {boolean} isBuild 是否是build命令
 */
export function getMode(argvs, isBuild) {
  const modeIndex = argvs.indexOf('--mode');
  const mIndex = argvs.indexOf('-m');
  if (modeIndex < 0 && mIndex < 0) return isBuild ? 'production' : 'development';

  const maxIndex = Math.max(modeIndex, mIndex);
  const maxModeName = argvs[maxIndex + 1];
  if (maxModeName && !maxModeName.startsWith('-')) return maxModeName;
  const minIndex = Math.min(modeIndex, mIndex);
  if (minIndex > -1) {
    const minModeName = argvs[minIndex + 1];
    if (minModeName && !minModeName.startsWith('-')) return minModeName;
  }
  return isBuild ? 'production' : 'development';
}

export function importFile(filePath) {
  return new Promise((resolve) => {
    import(filePath)
      .then(res => resolve(res))
      .catch(() => resolve());
  });
}

/**
 * 获取所有的可用项目
 */
export async function getAllProjects() {
  const projectsDir = getAbsoluteFilePath('../src/packages/');
  const isExist = existsSync(projectsDir);
  if (!isExist) return [];
  const names = readdirSync(projectsDir);
  const projects = {};
  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    const projectPath = projectsDir + name;
    const info = statSync(projectPath);

    if (info.isDirectory() && existsSync(`${projectPath}/index.html`)) {
      const configFilePath = `${projectPath}/config.json`;
      try {
        const config = JSON5.parse(readFileSync(configFilePath, 'utf-8'));
        if (!config.name) config.name = name;
        projects[name] = config;
      } catch (error) {
        console.log(`项目${name}中配置文件加载失败`);
      }
    }
  }
  return projects;
}

/**
 * 获取环境变量
 * @param {object} project 项目信息
 * @param {string} mode vite运行mode
 * @param {boolean} [isRun] 是否是仅运行时的环境变量，不暴露给客户端
 * @returns
 */
export function getEnvValues(project, mode, isRun) {
  const defaultEnvValues = isRun ? project.runEnv : project.env;
  const modeEnvValues = isRun ? project.modeRunEnv?.[mode] : project.modeEnv?.[mode];
  return { ...defaultEnvValues, ...modeEnvValues };
}
