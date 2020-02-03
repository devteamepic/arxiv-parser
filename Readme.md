# Arxiv data parser
for diploma work
### Commands:
Command | What it does
--------|-------------
```npm install``` | installs packages (required to run before start)
```npm start``` | starts an application (default 10 articles)
```npm start n``` | starts an application, which will download <n> documents *maximum amount is 3000*
```npm run drive``` | uploads ```data.zip``` to google drive
### Info:
After ```npm start``` or ```npm start n``` is called the application will
start the downloading files and put them in ```files``` directory, then it will generate
```data.csv``` where all data and file paths are contained
