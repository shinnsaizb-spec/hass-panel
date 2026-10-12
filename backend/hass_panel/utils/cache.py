import os
import json
import time
import hashlib
import re
from pathlib import Path
from typing import Any, Optional
from hass_panel.utils.config import cfg
from hass_panel.utils.singleton import singleton
from hass_panel.utils.safe_fs import safe_remove

# 缓存 key 会直接当文件名用 → 必须净化。当前调用方传的都是「固定前缀 + HA entity_id」
# （entity_id 本身不含 `/`），所以现在没有穿越风险；但 API 层不设防的话，
# 将来谁用请求参数当 key 就是一次路径穿越，这里直接堵死在入口。
_KEY_RE = re.compile(r'^[A-Za-z0-9_.-]{1,64}$')


@singleton
class FileCache:
    def __init__(self):
        self.cache_dir = Path(cfg.base.cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, key: str) -> Path:
        k = str(key or '')
        if not _KEY_RE.match(k):
            # 不抛错（免得一个奇怪的 entity_id 把接口打成 500）：退化成哈希文件名，
            # 既安全又不会互相覆盖。
            k = 'h_' + hashlib.sha1(k.encode('utf-8')).hexdigest()
        return self.cache_dir / f"{k}.json"
    
    def get(self, key: str) -> Optional[Any]:
        cache_path = self._get_cache_path(key)
        if not cache_path.exists():
            return None
            
        try:
            with open(cache_path, 'r') as f:
                data = json.load(f)
                
            # 检查是否过期
            if time.time() > data['expires_at']:
                self.delete(key)
                return None
                
            return data['value']
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600):
        cache_path = self._get_cache_path(key)
        data = {
            'value': value,
            'expires_at': time.time() + ttl
        }
        
        with open(cache_path, 'w') as f:
            json.dump(data, f)
    
    def delete(self, key: str):
        cache_path = self._get_cache_path(key)
        if cache_path.exists():
            safe_remove(cache_path)

    def cleanup(self) -> int:
        """清理过期缓存文件，返回删除数量。

        原来只有「被再次读取」的过期项才会删——没人再读的过期 JSON 会永久留在磁盘。
        启动时扫一遍即可（缓存量很小）。
        """
        removed = 0
        now = time.time()
        for p in self.cache_dir.glob('*.json'):
            try:
                with open(p, 'r') as f:
                    data = json.load(f)
                if now > float(data.get('expires_at', 0)):
                    if safe_remove(p):
                        removed += 1
            except Exception:
                # 损坏的缓存文件也一并清掉
                if safe_remove(p):
                    removed += 1
        return removed