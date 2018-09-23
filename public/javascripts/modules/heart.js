import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  axios
    .post(this.action)
    .then(res => {
      // this is the form tag
      // this.heart accesses the elements inside the form tag that have the named attribute heart
      // this accesses the button
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      $('.heart-count').textContent = res.data.hearts.length;
      if (isHearted) {
        this.heart.classList.add('heart__button--float');
        setTimeout(() => this.heart.classList.remove('heart__button--float'), 
          2500); // arrow func because this needs to reference the form tag
      }
    })
    .catch(console.error);
}

export default ajaxHeart;