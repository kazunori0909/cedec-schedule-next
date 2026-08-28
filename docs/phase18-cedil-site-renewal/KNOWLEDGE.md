# Phase 18 で判明した挙動・制約（CEDiL リニューアル後）

調査日: 2026-08-28

## URL とイベントID

- 年度別検索は `https://cedil.cesa.or.jp/cedil_sessions/search?event={id}`。ページ送りは `&page=N`
- 旧 `https://cedil.cesa.or.jp/cedil_sessions/search_tag/{id}` は **同じ ID の新 URL へ 301**
  （`location: .../search?event=760`）。PHP の `file_get_contents` は既定でリダイレクトを追うため、
  URL を直さなくても「取得は成功して 0 件」になる点に注意
- **ID は旧タグ番号と同一**。ページ内の年度プルダウン
  （`#event-pulldown-list` の `li[data-value]`）から全年度の対応が読める:

  | 年度 | ID  | 年度 | ID  | 年度 | ID  |
  | ---- | --- | ---- | --- | ---- | --- |
  | 2026 | 760 | 2020 | 728 | 2013 | 8   |
  | 2025 | 756 | 2019 | 720 | 2012 | 4   |
  | 2024 | 752 | 2018 | 717 | 2011 | 6   |
  | 2023 | 748 | 2017 | 713 | 2010 | 5   |
  | 2022 | 743 | 2016 | 712 | 2009 | 14  |
  | 2021 | 740 | 2015 | 709 | 2008 | 21  |
  |      |     | 2014 | 9   | 2007 | 23  |
  |      |     |      |     | 2006 | 22  |

  `$YEAR_EVENT`（2011〜2026）と完全一致。2010 以前はサイトには存在するが本アプリの対象外

## 一覧ページの HTML 構造

旧構造（`.session_list` / `h2` / `.page_change`）は**新サイトに 1 つも残っていない**。

```text
<ul class="c-session-card-list">
  <li>
    <a href="https://cedil.cesa.or.jp/cedil_sessions/view/3408?event=760" class="c-session-card">
      <div class="c-session-card__header">
        <span class="c-session-card__new">NEW</span>
        <div class="c-tag-group"><span class="c-tag --session">CEDEC 2026</span>…</div>
      </div>
      <h3 class="c-session-card__title">タイトル（省略されず全文が入る）</h3>
      <dl class="c-meta-list">
        <div class="c-meta-list__item">
          <dt class="c-meta-list__label">形式</dt>
          <dd class="c-meta-list__value">レギュラーセッション(60分)</dd>
```

- リンクは `<a class="c-session-card">` 自体で、`href` は**絶対 URL + `?event={id}`**
  （旧サイトは詳細 URL のみ）。既存 `cedil.json` と揃えるためクエリは落とす
- `c-session-card-list` が `c-session-card` を部分文字列として含むため、
  クラス照合は空白境界（`concat(' ', normalize-space(@class), ' ')`）必須
- `<h2>` はページ内に `sr-only` のものが 1 つあるだけ。旧パーサーの `h2` 起点は使えない
- 1 ページ 20 件（2026 は 8 ページ・157 件）

## ページネーション

```text
次ページあり: <a href="…?event=760&amp;page=2" class="c-pagination__arrow --next">
最終ページ  : <button class="c-pagination__arrow --next is-disabled" disabled>
```

最終ページでは要素が `a` から `button` に変わるため、**`a` に限定して問い合わせれば
存在有無がそのまま終端判定になる**。ページ番号は `href` の `page=` から取る。

## 「形式」は引き続き一覧から取れる

Phase 13 のライトニングトーク判定（現在は無効）で使っていた「形式」は、新構造では
`dt.c-meta-list__label` が `形式`、値が隣の `dd.c-meta-list__value`。
旧一覧の `形式 ： ` のような全角コロン・空白の揺れはなくなり、ラベルと値が別要素に分かれた。
2026 年度で確認できた値: レギュラーセッション(60分) / ショートセッション(25分) /
パネルディスカッション(60分) / ライトニングトーク。

## 検証結果

| 年度 | 件数 | 内容                                                                             |
| ---- | ---- | -------------------------------------------------------------------------------- |
| 2026 | 157  | 旧 94 件をすべて含む上位集合（会期後に資料が追加された分だけ増加）。URL 重複なし |
| 2014 | 125  | リニューアル前に旧パーサーで生成した `cedil.json` と **title / url が完全一致**  |

2014 の一致により、URL 形式の変更とセレクタ追従が旧挙動を再現できていることを確認した。
