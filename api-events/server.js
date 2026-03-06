const app = require('./app');
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`✅ API Events démarrée sur http://localhost:${port}`);
});