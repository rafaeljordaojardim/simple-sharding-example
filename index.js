const app = require("express")();
const {Client} = require("pg");
const HashRing = require("hashring");
const crypto = require("crypto");

const hr = new HashRing();
hr.add("5433");
hr.add("5434");
hr.add("5435");


const clients = {
    "5433": new Client({
        host: "localhost",
        port: "5433",
        user: "postgres",
        password: "password",
        database: "postgres"
    }),
    "5434": new Client({
        host: "localhost",
        port: "5434",
        user: "postgres",
        password: "password",
        database: "postgres"
    }),
    "5435": new Client({
        host: "localhost",
        port: "5435",
        user: "postgres",
        password: "password",
        database: "postgres"
    }),
};

connect();

async function connect() {
    try {
        await clients["5433"].connect();
        await clients["5434"].connect();
        await clients["5435"].connect();
    } catch (error) {
        console.log(error);
    }
}


app.post("/", async (req, res) => {
    const url = req.query.url;
    const hash = crypto.createHash("sha256").update(url).digest("base64");
    const urlId = hash.substring(0,5);

    const server = hr.get(urlId);
    console.log(hr);
    

    console.log(server);

    await clients[server].query("INSERT INTO url_table (url, url_id) VALUES($1,$2)", [url, urlId]);

    return res.send({
        urlId,
        url,
        server
    });
    
});

app.get("/:urlId", async (req, res) => {
    const urlId = req.params.urlId;
    const server = hr.get(urlId);
    console.log(server);

    const result = await clients[server].query("SELECT url, url_id FROM url_table WHERE url_id = $1", [urlId]);
    console.log(result);
    
    if (result.rowCount > 0) {
        const row = result.rows[0];
        return res.send({
            urlId: row.url_id,
            url: row.url,
            server
        });
    } else {
        return res.sendStatus(404);
    }
});

app.listen(3000, () => {
    console.log("listening port", 3000);
    
});