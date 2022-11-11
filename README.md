# nri-3-api-solo

https://docs.google.com/document/d/e/2PACX-1vTW7s6BNRMPMgmC69YVR7yHK1A3DQQuDsTcVS2N3HTVAG5Hfnjzmx4cWwZMW02pNwiXBAjQ9EnG2IeO/pub

## テーマ：エンタメ作品名の日英対訳表を操作するための API

直訳もあれば、工夫された訳し方をされているものもあって面白いので作成してみることにしました。

## セットアップ

- npm / postgres をクライアントにセットアップ
- 以下のコマンドを実行

```
$ npm init
$ npm install
```

## テーブル仕様

1 つだけなので、一覧は割愛しています。

### テーブル情報

| 項目名     | 説明             |
| ---------- | ---------------- |
| テーブル名 | dict             |
| 説明       | 読んで字のごとく |

### カラム情報

| カラム名 | データ型          | デフォルト | 制約                   | 説明・備考         |
| -------- | ----------------- | ---------- | ---------------------- | ------------------ |
| id       | serial (int 相当) | -          | PRIMARY_KEY / NOT_NULL | 自動附番の通し番号 |
| ja       | text              | -          | -                      | 日本語のタイトル   |
| en       | text              | -          | -                      | 英語のタイトル     |

## API 仕様

### POST /item

辞書にカラムを登録する

#### パスパラメータ

不要

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

空文字/null と undefined は区別されます（前者は空文字として受理、後者は指定が無かったことになる）

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
    },
    "oneOf": [
        "required": {
            "ja"
        },
        "required": {
            "en"
        },
    ]
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
            "description": "自動附番されたIDが返ってきます。生成されなかった場合は-1",
            "type": "number"
        },
        "ja":{
            "type": "string"
        },
        "en":{
            "type": "string"
        },
        "msg":{
            "description": "エラー時にのみ表示されます",
            "type": "string"
        }
    },
    "required": {
        "id"
    }
}
```

### GET /item/:id

辞書の内容を**ID で**検索する

#### パスパラメータ

#### Path parameters

| 名前 | 型     | 説明                              |
| ---- | ------ | --------------------------------- |
| id   | number | POST 時に附番された id を指定する |

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
            "description": "エラー時にのみ表示されます",
            "type": "string"
        }
    }
}
```

### GET /item

辞書の内容を**タイトル名で**検索する

#### パスパラメータ

#### Path parameters

不要

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

空文字/null と undefined は区別されます（前者は空文字として受理、後者は指定が無かったことになる）

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
    },
    "oneOf": [
        "required": {
            "ja"
        },
        "required": {
            "en"
        },
    ]
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
        "result": [
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
            "description": "エラー時にのみ表示されます",
            "type": "string"
        }
    }
}
```

### PATCH /item/:id

辞書の内容を更新する

#### パスパラメータ

#### Path parameters

| 名前 | 型     | 説明                              |
| ---- | ------ | --------------------------------- |
| id   | number | POST 時に附番された id を指定する |

#### クエリパラメータ

不要

#### リクエストボディの JSON Schema

空文字/null と undefined は区別されます（前者は空文字として受理、後者は指定が無かったことになる）

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
    },
    "oneOf": [
        "required": {
            "ja"
        },
        "required": {
            "en"
        },
    ]
}
```

#### レスポンスの HTTP ステータスコード

| code | name                  | description                                        |
| ---- | --------------------- | -------------------------------------------------- |
| 200  | OK                    | 更新に成功した場合                                 |
| 400  | BAD REQUEST           | リクエストに誤りがある場合                         |
| 404  | NOT FOUND             | 指定された ID に対応するリソースが見つからない場合 |
| 500  | INTERNAL SERVER ERROR | その他のエラー                                     |

#### レスポンスボディの JSON Schema

```
{
    "type": "object",
    "properties": {
        "result": [
            "ja":{
                "type": "string"
            },
            "en":{
                "type": "string"
            }
        ],
        "msg":{
            "description": "エラー時にのみ表示されます",
            "type": "string"
        }
    }
}
```

### DELETE /item/:id

#### パスパラメータ

#### Path parameters

| 名前 | 型     | 説明                              |
| ---- | ------ | --------------------------------- |
| id   | number | POST 時に附番された id を指定する |

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
        "msg":{
            "description": "エラー時にのみ表示されます",
            "type": "string"
        }
    }
}
```
