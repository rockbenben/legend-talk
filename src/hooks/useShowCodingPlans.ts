import { useState } from 'react';

// 高级开关：放出默认隐藏的订阅套餐服务商（火山 Coding Plan / 阿里 Token Plan）。
// 隐藏的理由与封号风险写在目录 hidden 字段的注释与开关旁的 Help 文案里。
// 只是一条界面偏好，不进 settings store —— 它不参与任何请求，也不该出现在设置
// 导入/导出里。
const STORAGE_KEY = 'settings-showCodingPlans';

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** 默认 false —— 隐藏的条目要用户显式放出。 */
export function useShowCodingPlans(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState<boolean>(readInitial);
  const update = (v: boolean) => {
    setShow(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? '1' : '0');
    } catch {
      /* localStorage 不可用（隐私模式等）—— 本次会话内仍然生效 */
    }
  };
  return [show, update];
}
