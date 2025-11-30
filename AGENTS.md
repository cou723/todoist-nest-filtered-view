# Agent Notes

## 本リポジトリについて

Todoistのオリジナルクライアントで、個人で使う用のプロジェクトです。
Todoistのタスクをツリー構造上に表示したり、統計データを表示したりして、自己肯定感を高めるのに使います。

## それぞれのディレクトリについて

基本的には以下のディレクトリが主なコンテンツです

- `frontend-react`
- `frontend-lit-legacy`
- `proxy`
- `cron`

### frontend-react

後述するfrontend-lit-legacyをreactで書き直しているディレクトリです。
フロントエンドの改修を依頼された場合は基本的にこちらを編集してください。
基本的にEffect.tsのエコシステムに乗せたいので、throwなどをしたい場合はEffectを返すようにしてください。

### frontend-lit-legacy

旧実装であるlitで実装されたフロントエンドのプロジェクトがあるディレクトリです。
基本的に参考のために残しており、ユーザーから特に指示がない場合は、こちらのディレクトリは編集せずに、`frontend-react`のことだと思ってください。

### proxy

いわゆるバックエンドですが、ほぼラッパーのようなもので以下の二つ目的のために作成されました。

- Sync APIのCORS回避
- Todoist APIのClient Secretの秘匿

現在`Deno Deploy Classic`にデプロイされています。

### cron

現在のTodoistの運用のために`Deno Deploy Classic`にデプロイしている、cronジョブです。

## ドキュメント

基本的にすべてのドキュメントは`docs`ディレクトリの中に格納されます。
プロジェクト全体にかかわるものは`./docs`にあり、フロントエンドなどの身に関係するなどのスコープが小さいドキュメントに関しては、そのプロジェクトの`./docs`にあります。

例えば`frontend-react`に関係するドキュメントは`./frontend-react/docs/`に格納されます。