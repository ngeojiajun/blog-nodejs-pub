module.exports={
  rules:{
    "special-pages":{
      "dont-enumerate": "true", /*dont list it in homepage*/
      "hide-timestamp": "true", /*hide timestamp*/
      "base":"/",
      "show-in-nav":"true", /*show the link in navigation*/
      "hide-tags":"true",
    }
  },
  /*excluse these category to be generated a meta page*/
  exclude:["special-pages"],
  /*name alias*/
  names:{
    development:"開発",
    dairy:"日記",
    nihongo:"日本語勉強"
  },
}
