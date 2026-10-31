# IB Daily Command Terms Writing — MYP 5 &rarr; DP Bridge

> **Opinion Writing から Evidence-Based Reasoning（根拠に基づく分析・立論）へ**  
> IB MYP 5（Humanities, Sciences, Design, Personal Project）で求められる **Command terms（Analyze, Justify, Explain, Evaluate など）** を毎日15分で鍛え、A4用紙1枚でシンプルに白黒印刷できるWebアプリケーションです。

---

## 🎯 開発の背景と目的

- **課題**:
  - 日本の学校や従来の英語教育で主流だった「Opinion Writing（自分はどう思うか）」からIBの「Command Terms」に移行する際、日本語的な発想のまま英作文をしてしまいがち。
  - `Justify` や `Explain` を書くときに、「I think...」「Because...」「good / bad」などの単調・口語的な言葉を繰り返してしまう。
  - 自分の主観ではなく、**「与えられた客観的データ・表・制約条件（Stimulus）」を正しく分析・パラフレーズし、論理的な構造で時間内に書く練習** が不可欠。
- **本ツールの解決策**:
  - 毎日2問（Humanities, Sciences, Design, Personal Project）が追加される。
  - **白黒印刷（A4ジャスト1枚）** に最適化されたクリーンなレイアウト。
  - **3種類の印刷テンプレート**（罫線付き答案用紙、ノート貼り付け用スリップ、データ分析特化）を用意。
  - **ワンクリック印刷**: ボタン1つでブラウザの印刷・PDF保存ダイアログが立ち上がる。
  - **Gemini API (`gemini-3.8-flash`)** と **GitHub Actions** により、利用状況にかかわらず毎日自動で新しい問題が蓄積・更新される。

---

## 📐 収録される問題の構成要素

各Taskには、IB MYP 5の生徒が直面する壁を克服するための足場かけ（Scaffolding）が網羅されています：

| 要素 | 内容 |
| :--- | :--- |
| **Command Term & 定義** | 公式IB定義と推奨パラグラフ構造（Claim &rarr; Evidence &rarr; Reasoning / Refutation） |
| **Stimulus (データ表)** | 4〜5列×3〜5行の定量的・比較データ表、前提条件、予算や空間などの制約条件 |
| **Recommended Structure** | 15分・120〜150語で収めるための3ステップ構成ガイダンス |
| **Academic Starters** | クリックでコピーできる高度な移行表現（例: *"A significant divergence is evident when..."*） |
| **Target Vocabulary** | 多様で精密なアカデミック語彙（*attributable to*, *disparity*, *unfeasible*, *trade-off* など） |
| **Words to Avoid** | 日本語的発想・口語表現（*I think*, *cheap*, *so*）とその適切な学術的言い換え |
| **Rubric Checklist** | 執筆後に自己採点できるMYP Criterion準拠のチェックリスト |

---

## 🖨️ 3つの印刷テンプレート

画面右上の **"Print Layout Template"** から用途に合わせて切り替え可能です：

1. 📝 **Worksheet (Ruled)** — *推奨*  
   - 上部に問題＋データ表＋ガイダンス、下部に15行の手書き用罫線（文字数目安付き）。
   - そのまま印刷してペンで時間を測って書き込めます。
2. ✂️ **Notebook (Paste Slip)**  
   - ノートに貼るためのコンパクトなスリップ。
   - 下部に「✂️ CUT ALONG THIS LINE & GLUE INTO NOTEBOOK」の切り取り線と貼り付け記録欄（日付、実測時間、語数）を配置。
3. 📊 **Data Focus**  
   - 複雑な表やスペック比較を大きく見やすく配置し、自己添削・語彙アップグレード用のメモ枠を設けた分析特化型。

---

## ⏱️ 内蔵15分タイマー

- ヘッダーの再生ボタン（▶）を押すと、IBの標準的なライティング目安である **15分カウントダウン** がスタートします。
- 画面でタイマーを動かしながら、印刷した用紙やノートに集中して手書き練習ができます。

---

## ⚙️ GitHub Pages & GitHub Actions セットアップ手順

本リポジトリを自身の GitHub アカウントにプッシュし、自動更新とサイト公開を有効化する手順です。

### 1. リポジトリを GitHub に Push
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git branch -M main
git push -u origin main
```

### 2. Gemini API キーの登録 (GitHub Secrets)
毎日定時に最新モデル `gemini-3.8-flash` で問題を自動生成するために、APIキーを登録します：
1. [Google AI Studio](https://aistudio.google.com/) で API キーを発行します。
2. GitHub リポジトリのページを開き、**Settings** &rarr; **Secrets and variables** &rarr; **Actions** に進みます。
3. **New repository secret** をクリックします。
   - **Name**: `GEMINI_API_KEY`
   - **Secret**: 発行した Gemini API キーを貼り付け
4. **Add secret** をクリックして保存します。

### 3. GitHub Pages の有効化
1. リポジトリの **Settings** &rarr; **Pages** に進みます。
2. **Build and deployment** の **Source** を **"GitHub Actions"** に変更します。
3. これにより、ワークフロー実行時に自動的に最新のサイトが公開されます。

### 4. ワークフローの手動実行テスト
毎日 00:00 UTC（日本時間 午前9時）に自動実行されますが、今すぐテストすることも可能です：
1. GitHub の **Actions** タブを開きます。
2. 左メニューの **"Daily IB Writing Generator & Deploy"** を選択します。
3. **Run workflow** ボタンをクリックして実行します。
4. 完了すると、`data/prompts.json` に新しい Day の問題がコミットされ、GitHub Pages に即座に反映されます。

---

## 💻 ローカルでの動作確認

ローカルで手元で確認したい場合：

```bash
# ローカルサーバー起動
python3 -m http.server 8000

# ブラウザでアクセス
# http://localhost:8000
```

### 手動での問題生成スクリプト実行:
```bash
# APIキーを指定して実行（gemini-3.8-flash）
export GEMINI_API_KEY="your-api-key"
python3 scripts/generate_daily.py

# または APIキーなしのドライラン（テスト用モックデータ生成）
python3 scripts/generate_daily.py --dry-run
```

---

## 📂 ディレクトリ構成

```
.
├── .github/
│   └── workflows/
│       └── daily-generator.yml   # 毎日Gemini APIで生成 & Pagesへデプロイ
├── data/
│   └── prompts.json              # 毎日の問題データ蓄積（Day 1から順次追加）
├── scripts/
│   └── generate_daily.py         # gemini-3.8-flash 呼び出し・データ更新スクリプト
├── index.html                    # アプリケーション本体
├── style.css                     # スクリーンUI ＆ 白黒A4印刷用CSS (@media print)
├── app.js                        # データ取得、UI操作、印刷生成、15分タイマー
└── README.md                     # 本ドキュメント
```
