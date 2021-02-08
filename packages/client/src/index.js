import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Context from './context';
import Visitor from './utils/visitor';
import { fetchCount, fetchRecent } from './utils/fetch';
import mathML from './utils/mathml';
import './index.css';
import './recent.css';
import './math.css';

export default function Waline({
  el, 
  placeholder = "Just Go Go.", 
  path = location.pathname, 
  avatar, 
  avatarForce,
  avatarCDN,
  meta = ['nick','mail','link'], 
  pageSize = 10, 
  lang = "zh-CN",
  langMode = {},
  highlight, 
  serverURL,
  emojiCDN,
  emojiMaps,
  requiredFields = [],
  copyRight = true,
  visitor = false,
  uploadImage,
  anonymous
} = {}) {
  try {
    path = decodeURI(path);
  } catch(e) {
    //ignore error
  }
  //compat multiple slash
  serverURL = serverURL.replace(/\/+$/, '');
  
  //visitor count
  if(visitor) {
    const visitorPromise = path ? Visitor.add({serverURL, path}) : Promise.resolve();
    visitorPromise.then(() => Visitor.show({serverURL}));
  }

  //comment count
  const $counts = [].filter.call(document.querySelectorAll('.waline-comment-count'), el => {
    if(!el.getAttribute('data-xid') && !el.getAttribute('id')) {
      return false;
    }
    if(el.innerText && el.innerText.trim()) {
      return false;
    }
    return true;
  });
  if($counts.length) {
    const paths = $counts.map(el => {
      let path = el.getAttribute('data-xid') || el.getAttribute('id');
      try {
        path = decodeURI(path);
      } catch(e) {
        //ignore error
      }
      return path;
    });

    fetchCount({serverURL, path: paths}).then(counts => {
      if(!Array.isArray(counts)) {
        counts = [counts];
      }
      $counts.forEach((el, idx) => (el.innerText = counts[idx]));
    });
  }

  //mathml 
  window.addEventListener('load', mathML);

  //comment list display
  const root = document.querySelector(el);
  if(!root) {
    return;
  }
  ReactDOM.render(
    <React.StrictMode>
      <Context 
        anonymous={anonymous}
        lang={lang} 
        langMode={langMode}
        emojiCDN={emojiCDN} 
        emojiMaps={emojiMaps}
        avatar={avatar}
        avatarCDN={avatarCDN}
        avatarFore={avatarForce}
        uploadImage={uploadImage}
      >
        <App 
          boxConfig={{serverURL, placeholder, meta, highlight, requiredFields, path}}
          listConfig={{path, pageSize, serverURL, avatar}}
          copyRight={copyRight}
        />
      </Context>
    </React.StrictMode>,
    root
  );
};

Waline.version = VERSION;
Waline.Widget = {
  RecentComments({el, serverURL, count}) {
    //评论列表展示
    const root = document.querySelector(el);
    if(!root) {
      return Promise.resolve();
    }

    return fetchRecent({serverURL, count}).then(comments => {
      if(!comments.length) {
        return comments;
      }
      root.innerHTML = `
      <ul class="waline-widget-list">
      ${comments.map(cmt => 
        `<li class="waline-widget-item"><a href="${cmt.url}">${cmt.nick}</a>：${cmt.comment}</li>`
      ).join('')}
      </ul>`;
      
      return comments;
    });
  }
};
