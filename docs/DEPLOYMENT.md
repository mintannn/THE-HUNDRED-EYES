# Vercelへの公開

このリポジトリはルートをNext.jsプロジェクトとしてデプロイします。静的エクスポートではなく、`app/api/observe/route.ts` のサーバー関数を含む構成です。

## プロジェクト設定

- Framework Preset：Next.js
- Root Directory：リポジトリのルート
- Install Command：`npm ci`
- Build Command：`npm run build`
- Production Branch：`main`

GitHubと接続すると、`main` の更新を本番に反映できます。既存のプロジェクトがある場合は、名前・チーム・Gitリポジトリが一致することを確認してリンクします。

## 環境変数

| 名前 | 設定先 | 用途 |
| --- | --- | --- |
| `TYPESAFE_API_KEY` | Production / Sensitive | JevのAPIキー。サーバー専用 |
| `JEV_MODEL` | Production | `jev-latest` |

PreviewにもJevを使う場合は、その環境にも明示的に設定します。キーのない環境は、作品情報に仮判定版と表示されます。

`.env.local` をアップロードせず、Vercelの環境変数として登録します。`.gitignore` と `.vercelignore` は環境ファイルを除外します。`NEXT_PUBLIC_` 変数やCLIの引数にキーを含めません。

環境変数を変更したら、新しいデプロイを作成してください。`vercel env pull` は既存の環境ファイルを上書きするため、ローカルのキーが入った `.env.local` を不用意に置き換えないでください。

## CLIでの公開

```sh
vercel login
vercel link
vercel env add TYPESAFE_API_KEY production --sensitive
vercel env add JEV_MODEL production
vercel deploy --prod
```

プロジェクトの機密情報は `.vercel` に置かれ、Git対象から除外されます。`.vercelignore` はテスト・生成済みプレビュー画像・制作資料をデプロイのアップロードから除外します。

## 公開後の確認

1. 本番URLと、デプロイ対象のコミットが一致することを確認する。
2. `GET /api/observe` が `{"engine":"jev"}` を返すことを確認する。これはキーの設定確認であり、実際の判定成功を保証するヘルスチェックではない。
3. 1文を投稿し、100人の判定・瞬き・アナリティクス・一覧が動くことを確認する。この操作は実際にJevへ送信される。
4. 作品情報から判定基準を開けること、Xへのリンクが現在の投稿文を引き継ぐことを確認する。確認だけでXに公開しない。

サーバーは同一Originのリクエストだけを受け付け、投稿は140文字までです。Jevへの待ち時間は25秒、Vercel関数の実行上限は30秒です。失敗時は前の判定を保ち、成功した仮の結果を表示しません。

## データの扱い

投稿を確定した文章がTypeSafeへ送信されます。入力途中の文章は送りません。アプリに投稿保存用のデータベースはなく、書き直しの履歴と同文の結果の再利用はブラウザのセッション内で扱います。

Xへの導線はWeb Intentです。Xのアクセストークンは使わず、投稿画面を開いた本人がX上で確定します。アプリから自動投稿しません。
