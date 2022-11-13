# nri-3-api-solo

https://docs.google.com/document/d/e/2PACX-1vTW7s6BNRMPMgmC69YVR7yHK1A3DQQuDsTcVS2N3HTVAG5Hfnjzmx4cWwZMW02pNwiXBAjQ9EnG2IeO/pub

## テーマ：日英対訳 DB を操作するための API

- さまざまな作品のタイトルについて、直訳もあれば工夫された訳し方をされているものもあって面白いと思ったので、作成してみることにしました
- model 層、controller 層を分けて実装しています
  - controller 層はわりかし雑かも知れませんが、model 層は（比較的）丁寧に作りこみました
- ユーザ入力に対する制御・テストは（比較的）精緻に行いましたが、その他の異常系（DB ダウン等）に対する制御・テストは未実施です

## セットアップ

- npm / postgres をクライアントにセットアップ
- DB `pj_1` を作成
- DB 内のテーブルが空の状態で、以下のコマンドを実行

```
$ npm init
$ npm install
$ npm run migrate
```

## テーブル仕様

1 つだけなので、一覧は割愛しています。

### テーブル情報

| 項目名                                   | 説明                                                                                                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| テーブル名                               | dict                                                                                                                       |
| 説明                                     | 日本語と英語のワードを 1:1 の多重度で定義しています                                                                        |
| null と空文字の区別                      | DB 側では区別されていますが、Model 層にて差分を吸収しています（insert/update では null に片寄せ、select では双方にマッチ） |
| ja, en の双方が null or 空文字のレコード | DB 側では 1 レコードのみ許容してしますが、Model 層にて入力を拒否しています                                                 |

### カラム情報

| カラム名 | データ型          | デフォルト | 制約                   | 説明・備考                           |
| -------- | ----------------- | ---------- | ---------------------- | ------------------------------------ |
| id       | serial (int 相当) | -          | PRIMARY_KEY / NOT_NULL | 自動附番。insert/update 時は指定不能 |
| ja       | text              | -          | UNIQUE                 | 日本語のタイトル                     |
| en       | text              | -          | UNIQUE                 | 英語のタイトル                       |

#### UNIQUE(ja, en) に対する、SQL 標準外の DB 制約

- 一方の値が同じで、かつ他方が null あるいは空文字のレコードを 2 つ以上保持できないように、DB 側で制約を掛けています
  - e.g., `('マーフィーの法則', null)` というレコードが既に存在する場合には、以下のレコードを追加できません：
    - `('マーフィーの法則', null)`
    - `('マーフィーの法則', '')`
- 一方が同じ値でなければ、他方が null あるいは空文字のレコードを 2 つ以上保持できます
  - e.g., 以下のレコードは並存可能です：
    - `(null, 'Breaking the Habit')`
    - `('', 'Separate Ways')`

## API 仕様

### 共通仕様

- 空文字/null と undefined は区別されます（前者は空文字が指定されたものとして受理、後者は無指定の扱いになります）
- 定義されていないパラメータは無視されます
- **セキュリティ周りは考慮していません（一応、SQLi はできないはず…）**

### POST /item

辞書にカラムを登録する

#### パスパラメータ

不要

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        }
    }
}
```

#### レスポンスの HTTP ステータスコード

| code | name                  | description                                      |
| ---- | --------------------- | ------------------------------------------------ |
| 201  | CREATED               | レコードが新しく追加された場合                   |
| 400  | BAD REQUEST           | リクエストに誤りがある場合                       |
| 409  | CONFLICT              | 既存のリソースが存在していて、追加に失敗した場合 |
| 500  | INTERNAL SERVER ERROR | その他のエラー                                   |

#### レスポンスボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "id":{
            "description": "自動附番されたID",
            "type": "number"
        },
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        },
        "msg":{
            "description": "エラーが無い場合はnull",
            "type": "string"
        }
    }
}
```

### GET /item/:id

- 辞書の内容を**ID で**検索する
- 後述の GET /item よりも優先されます
  - ID の指定を誤ると、400 エラーとなります（GET /item に処理が移行しません）

#### パスパラメータ

#### Path parameters

| 名前 | 型                 | 説明                              |
| ---- | ------------------ | --------------------------------- |
| id   | number \|\| string | POST 時に附番された id を指定する |

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

不要

#### レスポンスの HTTP ステータスコード

| code | name                  | description                          |
| ---- | --------------------- | ------------------------------------ |
| 200  | OK                    | 指定されたリソースが見つかった場合   |
| 400  | BAD REQUEST           | リクエストに誤りがある場合           |
| 404  | NOT FOUND             | 指定されたリソースが見つからない場合 |
| 500  | INTERNAL SERVER ERROR | その他のエラー                       |

#### レスポンスボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "id":{
            "type": "number"
        },
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        },
        "msg":{
            "description": "エラーが無い場合はnull",
            "type": "string"
        }
    }
}
```

### GET /item

- 辞書の内容を**タイトル名で**検索する
- **パスパラメータに ID を指定した場合には /item/:ID の処理が優先され、タイトル名の指定は無視されます**

#### パスパラメータ

#### Path parameters

不要

#### クエリパラメータ

不要（ID を指定すると、前述の GET /item/:id の処理になります）

#### リクエストボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        }
    }
}
```

#### レスポンスの HTTP ステータスコード

| code | name                  | description                          |
| ---- | --------------------- | ------------------------------------ |
| 200  | OK                    | 指定されたリソースが見つかった場合   |
| 400  | BAD REQUEST           | リクエストに誤りがある場合           |
| 404  | NOT FOUND             | 指定されたリソースが見つからない場合 |
| 500  | INTERNAL SERVER ERROR | その他のエラー                       |

#### レスポンスボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        [
            "id":{
                "type": "number"
            },
            "ja":{
                "type": "string"
            },
            "en":{
                "type": "string"
            }
        ],
        "msg":{
            "description": "エラーが無い場合はnull",
            "type": "string"
        }
    }
}
```

### PATCH /item/:id

辞書の内容を更新する

#### パスパラメータ

#### Path parameters

| 名前 | 型                 | 説明                              |
| ---- | ------------------ | --------------------------------- |
| id   | number \|\| string | POST 時に附番された id を指定する |

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        }
    }
}
```

#### レスポンスの HTTP ステータスコード

| code | name                  | description                                        |
| ---- | --------------------- | -------------------------------------------------- |
| 200  | OK                    | 更新に成功した場合                                 |
| 400  | BAD REQUEST           | リクエストに誤りがある場合                         |
| 404  | NOT FOUND             | 指定された ID に対応するリソースが見つからない場合 |
| 409  | CONFLICT              | 既存のリソースが存在していて、追加に失敗した場合   |
| 500  | INTERNAL SERVER ERROR | その他のエラー                                     |

#### レスポンスボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "id":{
            "type": "number"
        },
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        },
        "msg":{
            "description": "エラーが無い場合はnull",
            "type": "string"
        }
    }
}
```

### DELETE /item/:id

#### パスパラメータ

#### Path parameters

| 名前 | 型                 | 説明                              |
| ---- | ------------------ | --------------------------------- |
| id   | number \|\| string | POST 時に附番された id を指定する |

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

不要

#### レスポンスの HTTP ステータスコード

| code | name                  | description                                        |
| ---- | --------------------- | -------------------------------------------------- |
| 204  | NO CONTENT            | 削除に成功した場合                                 |
| 400  | BAD REQUEST           | リクエストに誤りがある場合                         |
| 404  | NOT FOUND             | 指定された ID に対応するリソースが見つからない場合 |
| 500  | INTERNAL SERVER ERROR | その他のエラー                                     |

#### レスポンスボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "id":{
            "type": "number"
        },
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        },
        "msg":{
            "description": "エラーが無い場合はnull",
            "type": "string"
        }
    }
}
```
