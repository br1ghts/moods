import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] =
    'XMLHttpRequest';

if (typeof document !== 'undefined') {
    const tokenElement = document.head.querySelector(
        'meta[name="csrf-token"]',
    );

    if (tokenElement) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] =
            tokenElement.content;
    }
}
