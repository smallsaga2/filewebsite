To host this file-sharing site on your Windows machine, you first need to install Node.js and Visual Studio Code.

1. Visit https://nodejs.org/en to download and install Node.js, and then visit https://code.visualstudio.com/ to download and install Visual Studio Code.
2. Create a folder anywhere on your computer, launch Visual Studio Code, click the Explorer button at the top left, and then click "Open Folder" to open the folder you created.
2.1. If Git is installed, open the terminal by clicking the terminal button at the top left of Visual Studio Code, and use the git clone command to clone this file.
2.2. If Git is not installed, click the green "Code" button on the top right of GitHub, download the ZIP file, and extract it into the folder you created.
3. In Visual Studio Code, navigate to the location where server.js is located, and in the terminal (as explained in steps 2 and 2.1), run the command npm install express multer, then execute the command node server.js to start the server.

Note: Always start the server using commands in the Visual Studio Code terminal. While it may run if executed via a shortcut, the site won’t be accessible.

*add*
I may not need port forwarding because I have my computer's LAN cable directly connected to a splitter that receives optical LAN at home. However, just in case, try accessing the hosting from a different internet than your home internet. If that doesn't work, try port forwarding.
