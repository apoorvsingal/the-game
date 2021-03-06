const gameArea = document.getElementById("game-area");
const waitingArea = document.getElementById("waiting-area");
const loginArea = document.getElementById("login-area");
const controlsEl = document.getElementById("main");
const logEl = document.getElementById("logs");
const cardsEl = document.getElementById("cards");
const planeEl = document.getElementById("plane");
const playersEl = document.getElementById("players");
const viewersEl = document.getElementById("viewers");
const chatsEl = document.getElementById("chats");
const wPlayersEl = document.getElementById("playerss");
const wPlayersNumEl = document.getElementById("players-num");
const chatInput = document.getElementById("chat-input");

const game = new Game();

const controls = {
	inputs: document.getElementsByClassName("input"),
	throwButton: document.getElementById("throw-button"),
	passButton: document.getElementById("pass-button"),
	lookButton: document.getElementById("look-button"),
	asInput: document.getElementById("as-input")
};

let selectedCards = [];

controls.passButton.onclick = () => {
	game.pass();
	disableInput();
};

controls.lookButton.onclick = () => {
	game.look();
	disableInput();
};

controls.throwButton.onclick = () => {
	if(controls.asInput.disabled || controls.asInput.value){
		game.put(selectedCards, game.nativeNames[controls.asInput.value] || controls.asInput.value);
		emptySelectedCards();
		disableInput();
	}
};

chatInput.onchange = () => socket.emit("chat", chatInput.value);

let currentView = "login";

const setView = (view, userType) => {
	
	gameArea.style.display = "none";
	loginArea.style.display = "none";
	waitingArea.style.display = "none";
	
	currentView = view;
	
	switch(view){
	case "game":
		gameArea.style.display = "flex";
		if(userType == "viewer")
			controlsEl.style.display = "none";
		break;
	case "login":
		loginArea.style.display = "flex";
		break;
	case "waiting":
		waitingArea.style.display = "flex";
		break;
	}
};

const updateView = (view, game) => {
	
	if(view == "waiting"){
		let html = "";
		for(let player of game.users.players){
			html += player.name+"</br>";
		}
		wPlayersNumEl.innerHTML = `(${game.users.players.length}/${game.playersNum}) players joined.</br>`;
		wPlayersEl.innerHTML = html;
	} else if(view == "game"){
		let i = 0;
		
		for(let player of game.users.players){
			if (player.name != game.you.name) {
				setPlayerInfo(player, i++);
			} else if(game.you.cards){
				setMainUserInfo(game.you);
				setCards(game.you.cards);
			}
		}
		
		let j = 0;
		for(let viewer of game.users.viewers) {
			setViewerInfo(viewer, j++);
		}
	}
};

const setCards = (cards) => {
	cardsEl.innerHTML = "";

	cards.forEach((card, i) => {
		const el = document.createElement("span");
		
		el.className = `card ${card[1] == "C" || card[1] == "S"? "black-card" : "red-card"}`;
		el.id = `card${i}`;
		el.innerHTML = `&#${game.getUnicodeChar(card)};`;
		
		el.onclick = () => {
			let index = selectedCards.indexOf(card);
			
			if(index > -1){
				selectedCards.splice(index, 1);
				el.classList.remove("selected-card");
			} else {
				selectedCards.push(card);
				el.classList.add("selected-card");
			}
		};
		
		cardsEl.appendChild(el);
	});
	
};

const setViewerInfo = ({ name }, index) => {
	let el = document.getElementById("viewer"+index);

	if(!el){
		el = document.createElement("div");
		el.className = "viewer";
		el.id = "viewer"+index;

		playersEl.appendChild(el);
	}

	el.innerHTML = name;
};

const setPlayerInfo = ({ name, num }, index) => {
	let el = document.getElementById("player"+index);

	if(!el){
		el = document.createElement("div");
		el.className = "player";
		el.id = "player"+index;

		playersEl.appendChild(el);
	}

	el.innerHTML = `${name}\t| ${num || "?"} cards`;
};

const setMainUserInfo = ({ name, cards }) => {
	document.getElementById("meta").innerHTML = `${name}\t| ${cards.length || "?"} cards`;
};

const logTurn = (turn) => {
	if(turn.type == "first"){
		logEl.innerHTML = `${turn.player} will do the first turn. ${turn.extraCards.length == 0 ? `No cards were left out of the game.` : (turn.extraCards.length == 1 ? `The ${game.normalizeCard(turn.extraCards[0])} is left out of the game.` : `${turn.extraCards.map(card => game.normalizeCard(card)).join(", ")} are left out of the game.`)}`;
		return;
	}
	
	let html;
	
	switch(turn.type){
	case "put":
		html = `${turn.player} throwed ${turn.num == 1 ? (turn.card == "A" ? "an" : "a") : turn.num} ${game.normalNames[turn.card] || turn.card}${turn.num > 1 ? "s": ""}.`;
		break;
	case "pass":
		html = `${turn.player} passed.`;
		break;
	case "look":
		html = `${turn.player} saw the cards. The cards were ${turn.success ? "wrong" : "right"}. All cards on plane will be given to ${turn.success ? turn.last : turn.player}.`;
		break;
	case "current_turn":
		if(turn.num){
			html = `The current turn has ${turn.num} ${turn.card}s.`;
		} else { 
			html = `There is nothing on the plane yet.`;
		}
		break;
	}
	
	logEl.innerHTML = html+` Its ${turn.next == game.you.name ? "your" : turn.next+"'s"} turn now.`;
};

const enableInput = (inputs) => {
	for(let i = 0; i < controls.inputs.length; ++i){
		const input = controls.inputs[i];
		if(inputs.some(inp => input.id.startsWith(inp))) {
			input.disabled = false;
		}
	}
};

const disableInput = () => {
	for(let i = 0; i < controls.inputs.length; ++i){
		const input = controls.inputs[i];
		input.disabled = true;
	}
};

const putOnPlane = (num) => {
	for(let i = 0; i < num; ++i){
		const el = document.createElement("span");
		
		el.innerHTML = "&#x1F0A0;";
		el.className = "card-back";
		
		el.style["margin-left"] = String(Math.floor(Math.random()*150)-75)+"px";
		el.style["margin-bottom"] = String(Math.floor(Math.random()*150))+"px";
		el.style.transform = `rotate(${Math.floor(Math.random()*90)-45}deg)`;
		
		planeEl.appendChild(el);
	}
};

const emptyPlane = () => {
	planeEl.innerHTML = "";
};

const emptySelectedCards = () => {
	const cards = document.getElementsByClassName("selected-card");
	let x = cards.length;
	
	for(let i = 0; i < x; ++i){
		cards[0].classList.remove("selected-card");
	}
	selectedCards = [];
};

const flipTopCards = (cards) => {
	const cardEls = planeEl.childNodes;
	const x = cards.length*132/2;

	for(let i = 1; i <= cards.length; ++i){
		const cardEl = cardEls[cardEls.length-i];
		
		const transform = cardEl.style.transform;
		const margins = cardEl.style.margin;

		cardEl.style.transform = "rotate3d(0.5, 0.5, 0, 90deg)";

		cardEl.style.margin = "0";
		cardEl.style["margin-left"] = `${132*i-x}px`;

		setTimeout(() => {
			cardEl.innerHTML = `&#${game.getUnicodeChar(cards[cards.length-i])};`
			cardEl.style.transform = "rotate3d(0.5, 0.5, 0, 0deg)";
		}, 250);
	}
};

const pushToChat = (chatMsg) => {
	const el = document.createElement("div");

	el.className = "chat-msg";
	el.id = "chat-msg-"+chatsEl.childNodes.length;

	el.innerHTML = `<span class="chat-msg-author">${chatMsg.user}:</span><span class="chat-msg-content">${chatMsg.msg}</span>`;
	chatsEl.appendChild(el);
};

game.prep();

game.on("join", (user) => {
	updateView(currentView, game);
});

game.on("leave", (usr) => {
	updateView(currentView, game);
});

game.on("turn", (turn) => {
	if(turn.type == "put"){
		putOnPlane(turn.num);
	} else if(turn.type == "look"){
		flipTopCards(turn.cards);
	}
	logTurn(turn);
});

game.on("new_turn", (turn) => {
	if(turn.type == "put") {
		putOnPlane(turn.num);
	} else if(turn.type == "look") {
		flipTopCards(turn.cards);
	}
	logTurn(turn);
});

game.on("my_turn", () => {
	enableInput(["throw", "look", "pass"]);
});

game.on("my_new_turn", () => {
	enableInput(["throw", "as"]);
});

game.on("game_flush", () => {
	setTimeout(() => { emptyPlane() }, 3000);
});

game.on("cards", () => {
	updateView("game", game);
});

game.once("start", ({ player, extraCards }) => {
	setView("game");
	updateView("game", game);
	logTurn({ type: "first", player, extraCards });
});

game.once("abort", () => {
	document.write("Aborted.");
});

game.once("winner", (winner) => {
	document.write(winner + " won.");
});

game.on("chat", (chatMsg) => {
	pushToChat(chatMsg);
});

game.onUpdate = () => {
	updateView("game", game);
};

const loginButton = document.getElementById("login-button");
const nameInput = document.getElementById("name-input");

disableInput();
/*
setView("game");
setCards([
	["A", "S"],
	["K", "C"],
	["A", "S"],
	["10", "H"],
	["Q", "D"],
	["K", "C"],
	["A", "S"],
	["10", "H"],
	["Q", "D"],
	["K", "C"],
]);
enableInput(["throw", "look", "pass", "as"]);
*/
loginButton.onclick = () => {
	game.join({
		name: nameInput.value || Math.random().toString(35)
	})
	.then(async () => {
		if(game.state != "WAITING") {
			setView("game", game.you.type);
		} else {
			setView("waiting");
		}
		updateView(currentView, game);
	});
};