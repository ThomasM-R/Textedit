const textbox = document.getElementById("textbox");
const statusbar = document.getElementById("statusbar");
const VERSION = "0.8.1";

// listen for errors
window.onerror = (event, source, lineno, colno, error) => {
	statusbar.innerHTML = `<div style="animation: error infinite linear 0.5s;">${event}</div>`;
};

// default settings
var settings = {
	"statusbar": true,
	"fileinfo": true,
	"charcount": false,
	"wordcount": true,
	"filesize": true,
	"tabs": false,
	"version": true
};

// load previous settings
if (localStorage.getItem("settings")) {
	settings = JSON.parse(localStorage.getItem("settings"));
}

// load settings into menu
function refreshMenuButtons() {
	for (let menuButton of document.querySelectorAll(".dropdown .menu button")) {
		// disable settings if undefined
		if (settings[menuButton.name] == undefined)
			settings[menuButton.name] = false;
		// check buttons based on settings
		if (settings[menuButton.name] != menuButton.hasAttribute("checked"))
			menuButton.toggleAttribute("checked");
		// toggle statusbar buttons
		if ((settings["statusbar"] == menuButton.hasAttribute("disabled")) && ["fileinfo", "charcount", "wordcount", "filesize", "version", "debug"].includes(menuButton.name)) 
			menuButton.toggleAttribute("disabled");
		// toggle dangerous features
		if ((settings["danger"] == menuButton.hasAttribute("disabled")) && ["code", "runasjs"].includes(menuButton.name)) 
			menuButton.toggleAttribute("disabled");
	}
}

var filename = "Untitled.txt";
var saved = true;
var fileHandle;

// check for FileSystemAPI
if (!('showOpenFilePicker' in window) || new URLSearchParams(location.search).has("noFileSystem")) {
	let saveButton = document.querySelector(".dropdown .menu button[name='save']");
	saveButton.setAttribute("disabled", true);
	saveButton.title = "This feature is not supported in your browser.";
	console.warn("FileSystemAPI not supported; Switching to fallback file download/upload method");
	// this forces the download/upload method
	fileHandle = null;
}

const buttonActions = {
	"quit": ()=>{
		window.location.assign("./");
	},
	"about": ()=>{
		window.alert(`Textedit verison ${VERSION}\nMade by Thomas Moraine-Radenac\nCRLS 2024`);
	},
	"defaults": ()=>{
		if (confirm("Locally saved settings will be reset!"))
		localStorage.clear();
		window.location.reload();
	},
	"new": ()=>{
		if (saved || confirm("Your file is not saved! Replace anyway?")) {
			filename = "Untitled.txt";
			textbox.value = "";
			textbox.focus();
			saved = true;
		}
		refreshStatusBar();
	},
	"save": async()=>{
		if (fileHandle === undefined) {
			fileHandle = await window.showSaveFilePicker({suggestedName: filename});
			let file = await fileHandle.getFile();
			filename = file.name;
		}
		let writable = await fileHandle.createWritable();
		await writable.write(textbox.value);
		await writable.close();
		saved = true;
		refreshStatusBar();
	},
	"saveas": async()=>{
		if (fileHandle !== null) {
			fileHandle = await window.showSaveFilePicker({suggestedName: filename});
			let writable = await fileHandle.createWritable();
			await writable.write(textbox.value);
			await writable.close();
			let file = await fileHandle.getFile();
			filename = file.name;
		}
		// fallback for browsers not supporting FileSystemAPI
		else {
			let downloadLink = document.createElement("a");
			downloadLink.href = "data:text/plain;base64," + btoa(textbox.value);
			downloadLink.download = filename;
			downloadLink.click();
			downloadLink.remove();
		}
		saved = true;
		refreshStatusBar();
	},
	"open": async()=>{
		if (fileHandle !== null) {
			[fileHandle] = await window.showOpenFilePicker({
				types: [
					{description: "", accept: {"text/*": [".json", ".frag"]}},
				]
			});
			let file = await fileHandle.getFile();
			if (saved || confirm("Your file is not saved! Replace anyway?")) {
				filename = file.name;
				saved = true;
				textbox.value = await file.text();
				textbox.selectionStart = textbox.selectionEnd = 0;
				refreshStatusBar();
			}
		}
		// fallback for browsers not supporting FileSystemAPI
		else {
			fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.addEventListener("change", async(event)=>{
				file = event.target.files[0];
				if (saved || confirm("Your file is not saved! Replace anyway?")) {
					filename = file.name;
					saved = true;
					textbox.value = await file.text();
					textbox.selectionStart = textbox.selectionEnd = 0;
					refreshStatusBar();
				}
			})
			fileInput.click();
			fileInput.remove();
		}
	},
	"selectall": ()=>{
		textbox.select();
	},
	"copy": ()=>{
		navigator.clipboard.writeText(window.getSelection().toString())
	},
	"paste": async ()=>{
		const [start, end] = [textbox.selectionStart, textbox.selectionEnd];
		textbox.setRangeText(await navigator.clipboard.readText(), start, end, 'select');
		textbox.focus();
		window.getSelection().collapseToEnd();
	},
	"cut": ()=>{
		let selection = window.getSelection();
		navigator.clipboard.writeText(selection.toString())
		selection.deleteFromDocument();
	},
	"code": async ()=>{
		const codeSamples = [
			"text.replaceAll('\\n', '')",
			"text.toUpperCase()",
			"\"data:text/plain;base64,\" + btoa(text)"
		];
		try {
			let code = window.prompt("Enter javascript snippet:\nVariable `text` is current text", codeSamples[Math.floor(Math.random() * (codeSamples.length + 1))]);
			textbox.value = await eval(`(async (text)=>${code})(textbox.value);`);
			refreshStatusBar();
		} catch(e) {
			alert(e);
		}
	},
	"runasjs": async ()=>{
		if (menuButton.hasAttribute("disabled")) return;
		try {
			alert(await eval(`(async (text)=>{${textbox.value};})(textbox.value);`));
			refreshStatusBar();
		} catch(e) {
			alert(e);
		}
	},
	"template": ()=>{
		if (saved || confirm("Your file is not saved! Replace anyway?")) {
			filename = "donut.js";
			textbox.value = `// Stolen- er, i mean- Permanently borrowed without permission from https://www.hmz.ie/javascript-donut\n// [Help] > [Danger Zone] > [Run file as Javascript]\n\n               let x=1760,\n          z=0,y=0;setInterval\n        (()=>{z+=.07,y+=.03;const\n      a=[...new Array(x)].map( (a,r\n    )=>r % 80 === 79 ?"\\n":" "),r=new\n   Array(x).fill(0), t= Math.cos(z),e=\n  Math.sin(z),n=Math.cos(y), o=Math.sin\n (y);for(let s=0;s<6.28; s+=.07){const c\n =Math.cos(s),h=      Math.sin(s);for(let\ns=0;s<6.28;s+=          .02){const v=Math\n.sin(s),M=Math          .cos(s),i=c+2,l=1\n /(v*i*e+h*t+5          ),p=v*i*t-h*e,d=0\n |40+30*l*(M*i*n      -p*o),m=0|12+15*l*\n  (M*i*o+p*n),f=0|8*((h*e-v*c*t)*n-v*c*\n    e-h*t-M*c*o), y=d+80*m;m<22&&m>=0\n     &&d>=0&&d<79&&l>r[y] &&(r[y]=l,\n      a[y]= ".,-~:;=!*#$@"[f>0?f:0\n       ])}}textbox.value=a.join\n          ("")},50); /* JS by \n              @housamz */`;
			textbox.selectionStart = textbox.selectionEnd = 0;
			textbox.focus();
			saved = true;
		}
		refreshStatusBar();
	}
};

// dropdown menus actions
for (let menuButton of document.querySelectorAll("nav .menu button")) {
	menuButton.addEventListener("click", (e) => {
		// toggle buttons
		if (menuButton.hasAttribute("toggle")) {
			settings[menuButton.name] = !menuButton.hasAttribute("checked");
			localStorage.setItem("settings", JSON.stringify(settings));
			refreshMenuButtons();
			refreshStatusBar();
		}
		// link buttons
		if (menuButton.hasAttribute("href")) {
			window.open(menuButton.getAttribute("href"));
			return;
		}
		// action buttons
		if (buttonActions[menuButton.name] != undefined) {
			buttonActions[menuButton.name]();
			return;
		}
	});
}

function refreshStatusBar() {
	if (settings.statusbar) {
		statusbar.style.display = "flex";
		let text = "";
		let bytes = new Blob([textbox.value]).size;
		const statusMessages = {
			"fileinfo": `Editing ${filename}` + (saved ? "": " (Unsaved)"),
			"charcount": `${textbox.value.length} chars`,
			"wordcount": `${textbox.value.trim().split(/\s+/).length} words`,
			"filesize": (bytes > 999 ? `${Math.floor(bytes / 100) / 10} KB` : `${bytes} bytes`),
			"version": `Textedit v${VERSION}`,
			"debug": JSON.stringify(settings)
		};
		for (let i of Object.keys(statusMessages)) {
			if (settings[i]) {
				text += `<div>${statusMessages[i]}</div>`;
			}
		}
		statusbar.innerHTML = text;
	} else {
		statusbar.style.display = "none";
	}
	// also refresh linewrap on textbox - idk where else to do this lol 
	if (settings["linewrap"] != textbox.hasAttribute("linewrap")) {
		textbox.toggleAttribute("linewrap");
	}
}

// prevent window close if not saved
window.addEventListener('beforeunload', function (e) {
	if (!saved) {
		e.preventDefault();
		e.returnValue = '';
	}
});

// catch keyboard shortcuts
textbox.addEventListener('keydown', e => {
	if (e.ctrlKey) {
		if (e.key === 'q') {
			buttonActions["quit"]();
		} else if (e.key === 's') {
			e.preventDefault();
			if (e.shiftKey)
				buttonActions["saveas"]();
			else 
				buttonActions["save"]();
		} else if (e.key === 'o') {
			e.preventDefault();
			buttonActions["open"]();
		} else if (e.key === 'Enter') {
			buttonActions["runasjs"]();
		}
	} else {
		if (e.key === "Tab" && settings.tabs) {
			e.preventDefault();
			textbox.value += "\t";
		} else if (e.key === "Escape") {
			document.querySelector(".dropdown button").focus();
		}
	}
});

// refresh on text input
textbox.addEventListener("input", ()=>{
	saved = false;
	refreshStatusBar();
});

// refresh on load
refreshMenuButtons();
refreshStatusBar();