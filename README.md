This is the public repo for the blog engine used my blog

Installation:
```
git clone https://github.com/ngeojiajun/blog-nodejs-pub/
cd blog-nodejs-pub
mkdir posts
```

This blog engine store its files inside `posts` folder using `.txt` file format.
A valid posts will have following format
```
#title <title>
#prop <key> <value>
#style <css style rule> <value>
#parastart
<content>
#end
```

To generate the page:
```
node index
```
A folder named `output` with the html files will be produced.

MORE DESCRIPTION IN FUTURE
