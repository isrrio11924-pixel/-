# 航路（Kouro）— 就活メンター・メンティー支援アプリ

就活生（メンティー）が企業ごとの進捗と「今の気持ち」を軽く記録し、
メンター（先輩・OB/OG）がそれを俯瞰して、フォローが必要な後輩に気づける
Webアプリのプロトタイプです。

## 今の状態（フェーズ1・プロトタイプ）

- `src/lib/mock-data.ts` のダミーデータで動く、見た目・操作感を確認できる版です。
- Supabase（認証・DB）はまだ接続していません。`supabase/schema.sql` に
  テーブル設計を用意してあるので、次のステップで接続します。

### 画面

| パス | 内容 |
|---|---|
| `/` | ロール選択（メンティー / メンター） |
| `/mentee` | 企業一覧・選考ステータス更新・今日のひとこと記録 |
| `/mentor` | 担当メンティー一覧（要フォロー検知）・詳細・メモ |

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 で確認できます。

## Claude Codeで開発を続ける手順

このプロジェクトのフォルダを開いて `claude` を起動し、以下のように伝えるとスムーズです：

```
このプロジェクトにSupabaseを接続したいです。
supabase/schema.sql のテーブル設計をもとに、
1. Supabaseプロジェクトの作成手順を教えてください（自分でブラウザ操作します）
2. .env.local.example を参考に .env.local を作る手順
3. src/lib/mock-data.ts を使っている部分を、Supabaseからのfetch/insertに置き換える
4. メンティーのサインアップ時にrole（mentor/mentee）を選べるようにする
5. メンター⇄メンティーの関係（mentor_mentee_relations）を、招待コードで結びつける機能を追加する
```

Supabaseのプロジェクト作成やAPIキーの取得だけは、自分のブラウザで行う必要があります
（Claude Codeはブラウザ操作の代行はできません）。

## 次に効くと思う優先順位

1. **認証 + メンター/メンティーの紐付け**（招待コードやメールでの招待）
2. **要フォロー検知のロジック調整**（何日で「停滞」とみなすか、締切との組み合わせなど）
3. **通知**（LINE通知連携があると、メンター側の「気づき」がさらに早くなる）
4. **フェーズ2：横のつながり**（`check_ins.visibility` を使って段階的に公開範囲を広げる）

## デプロイ

```bash
npm run build
```

Vercelにこのリポジトリを接続するだけで、無料枠でデプロイできます
（Supabase接続後、環境変数をVercel側にも設定してください）。

## ディレクトリ構成

```
src/
  app/
    page.tsx          ロール選択
    mentee/page.tsx    メンティー画面
    mentor/page.tsx    メンター画面
  components/
    badges.tsx         ステータス・温度感・タグの共有UI
  lib/
    types.ts            ドメイン型定義
    mock-data.ts        プロトタイプ用ダミーデータ
    supabase/client.ts   Supabase接続用（未使用・雛形）
supabase/
  schema.sql            テーブル設計・RLSポリシー
```
