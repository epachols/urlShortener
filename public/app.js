var app = new Vue({
    el: '#app',
    data: {
        url:'',
        slug: '',
    },
    methods: {
        createUrl() {
            console.log(this.url, this.slug);
        }
    }

    
})

// el: '#app',
// data: {
//     message: 'Hello Vue!'
// }