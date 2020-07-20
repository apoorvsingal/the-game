const onChange = (self) => {
    fetch("/api/creategame", {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify({ name: self.value.split(':')[0], num: Number(self.value.split(":")[1]) })
    })
    .then((res) => res.text())
    .then(txt => {
        document.write(txt);
    });
};