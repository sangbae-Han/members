import { FolderDown, Info } from "lucide-react";

export function GabiaDownload() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">가비아 배포 안내</h2>
        <p className="text-muted-foreground text-sm mt-1">빌드 파일을 가비아 호스팅에 업로드하는 방법입니다.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <FolderDown size={18} />
          <h3 className="font-semibold text-sm">배포 순서</h3>
        </div>
        <ol className="space-y-3 text-sm text-foreground">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <div>
              <p className="font-medium">빌드 실행</p>
              <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">pnpm build</code>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <div>
              <p className="font-medium">dist/ 폴더 → FTP 업로드</p>
              <p className="text-muted-foreground text-xs mt-1">가비아 FTP: <code className="bg-muted px-1 rounded">cargowing.gabia.io</code> → <code className="bg-muted px-1 rounded">/wings_html/</code></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <div>
              <p className="font-medium">php-api/ 폴더 → FTP 업로드</p>
              <p className="text-muted-foreground text-xs mt-1">PHP 파일을 <code className="bg-muted px-1 rounded">/wings_html/api/</code>에 업로드</p>
            </div>
          </li>
        </ol>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-blue-700 text-sm">배포 후 접속 URL: <strong>http://cargowing.gabia.io/wings_html/index.html</strong></p>
      </div>
    </div>
  );
}
