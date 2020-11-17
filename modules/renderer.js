const ejs=require("ejs");
const fs=require("fs");
const loader=require("./loader.js");
const strings=require("../locales/en.js");
const {getPage,generateUrl}=require("./page_context.js");
let template=ejs.compile(ejs.fileLoader("./views/home.ejs", 'utf8')); //compile the view first
function generate_and_dump(ctx,out_file){
  fs.writeFileSync(out_file,template(ctx).replace(/\s*[\r\n]/gm,""));
}
async function generate_home(){
  let ids=loader.getHome();
  let ctx={
    strings:strings,
    env:{name:""}
  };
  if(ids.length===0){
    ctx.page=getPage("home");
  }
  else{
    let post=await loader.getPost(ids[0]);
    ctx.page=Object.assign({context:"home"},getPage("post-inline"));
    ctx.post=post;
  }
  generate_and_dump(ctx,"./output/index.html");
  console.log(`Generated / => ./output/index.html`);
}
async function generate_posts(x,skip_when_exists){
  let _list=loader.getEnumratableBlog(x);
  if(_list.length===0){
    throw `Invalid tag ${x}`;
  }
  let baseDir="./output/";
  baseDir+=(loader.getMetaTagUrl(x)||(x?"tags/"+x:"posts"));
  if (fs.existsSync(baseDir)){
    if(skip_when_exists)return;
  }
  else{
    fs.mkdirSync(baseDir,{recursive:true});
  }
  const max=20;
  const pages=Math.trunc(_list.length/max)+((_list.length%max===0)?0:1);
  for(let i=0;i<pages;i++){
    let post=_list.slice(i*max,(i+1)*max).map(x=>{let a=loader.getManifest(x);a._link=generateUrl(x);return a;});
    fs.mkdirSync(`${baseDir}/${i+1}/`);
    let url=baseDir.replace("//","/").slice(8);
    if(!url.endsWith("/"))url+="/";
    generate_and_dump({
      strings:strings,
      page:Object.assign({meta:loader.getMetaTagUrl(x)!==undefined},getPage("posts")),
      post:post,
      env:{
        name:`${x}`,
        use_pages:_list.length>max,
        idx:i,
        pages:pages,
        url_base:url.slice(0,url.lastIndexOf("/"))+"/",
        base:url.slice(0,(url.slice(1)).indexOf("/")+1),
        tag:x?`#${x}`:strings.posts
      }
    },`${baseDir}/${i+1}/index.html`);
    console.log(`Generated ${baseDir.slice(8)}/${i+1}/ => ${baseDir}/${i+1}/index.html`);
  }
  fs.copyFileSync(`${baseDir}/1/index.html`,`${baseDir}/index.html`);
  console.log(`Copied ${baseDir}/index.html => ${baseDir}/1/index.html`);
}
async function generate_page(item){
  let manifest=loader.getManifest(item); //we need the url
  if(manifest.properties.role==="home")return;
  let baseDir="./output";
  let post=await loader.getPost(item);
  let list=loader.getEnumratableBlog();
  let showPrevNext=list.includes(item);
  let currentIndex=list.indexOf(item);
  let prev=(currentIndex+1>=list.length)?undefined:list[currentIndex+1];
  let next=(currentIndex-1<0)?undefined:list[currentIndex-1];
  baseDir+=manifest.properties.base;
  baseDir+=`/${manifest.properties.url||item}`; //name
  if (!fs.existsSync(baseDir)){
    fs.mkdirSync(baseDir,{recursive:true});
  }
  let url=baseDir.replace("//","/").slice(8);
  if(!url.endsWith("/"))url+="/";
  let baseUrl;
  /**
  *IMPORTANT: without this url like /about-me will have incorrect base
  */
  if(url.match(/^\/[^\/]+\/$/gm))baseUrl="/";
  else baseUrl=url.slice(0,(url.slice(1)).indexOf("/")+1);
  generate_and_dump({
    strings:strings,
    page:getPage("post"),
    post:post,
    env:{
      name:manifest.properties.url||item,
      showPrevNext:showPrevNext,
      prev:prev,
      next:next,
      url_base:url.slice(0,url.lastIndexOf("/")),
      base:baseUrl,
    }
  },`${baseDir}/index.html`);
  console.log(`Generated normal page ${baseDir.slice(8)}/ => ${baseDir}/index.html`);
}
module.exports = async function (tags) {
  let copy=loader.getManifestBody();
  //recreate the output folder
  fs.rmdirSync("./output", { recursive: true });
  await new Promise(function(resolve) {
    setTimeout(resolve,1000);
  });
  fs.mkdirSync("./output");
  fs.mkdirSync("./output/tags/");
  require("copy-dir").sync("./public","./output/public");
  //first, generate the / first
  await generate_home();
  //second, generate the /posts/*
  await generate_posts();
  //now, create all the pages
  const names=Object.keys(copy);
  for(let i=0;i<names.length;i++){
    let item=names[i];
    //if this tag refers to a meta page (list)
    //generate the list
    if(loader.isMetaPage(item)){
      await generate_posts(copy[item].title);
    }
    else{
      await generate_page(item);
    }
  }
  //final stage: generate pages for tags
  tags=tags||[];
  for(let i=0;i<tags.length;i++){
    await generate_posts(tags[i],true);
  };
  //additional pages:
  //404
  await generate_and_dump({
    strings:strings,
    page:getPage("error"),
    env:{
      name:"",
      error:strings.page_not_found,
      error_desc:strings.page_not_found_txt
    }
  },"./output/404.html");
  console.log(`Generated error page /404.html => ./output/404.html`);
  console.log("done");
};
