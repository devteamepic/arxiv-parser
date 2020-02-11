# Arxiv data parser
for diploma work
### Commands:
| Command             | What it does                                                                      |
| ------------------- | --------------------------------------------------------------------------------- |
| ```npm install```   | installs packages (required to run before start)                                  |
| ```npm start```     | starts an application (default 10 articles)                                       |
| ```npm start n```   | starts an application, which will download <n> documents *maximum amount is 3000* |
| ```npm run drive``` | uploads ```data.zip``` to google drive                                            |
### Info:
After ```npm start``` or ```npm start n``` is called the application will
start the downloading files and put them in ```files``` directory, then it will generate
```data.csv``` where all data and file paths are contained
#### ```data.csv``` fields:
| Field                 | Meaning                                                 |
| --------------------- | ------------------------------------------------------- |
| ```id```              | the id of article in form of arxiv link                 |
| ```lastUpdatedData``` | sbit*                                                   |
| ```publishedDate```   | sbit*                                                   |
| ```title```           | sbit*                                                   |
| ```summary```         | sbit*                                                   |
| ```authors```         | one or more authors                                     |
| ```category```        | category by arxiv categories                            |
| ```metadData```       | miscalanious info about article (num of pages and etc.) |
| ```downloadLink```    | arxiv link to ```.pdf``` document                       |
| ```filePath```        | path of downloaded file in ```./files``` directory      |

**says by itself*