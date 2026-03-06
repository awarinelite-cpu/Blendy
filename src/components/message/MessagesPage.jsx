# If MessagesPage.jsx is still in the old location
git mv src/components/MessagesPage.jsx src/components/messages/MessagesPage.jsx

git add .
git commit -m "Fix: move MessagesPage to correct subfolder"
git push
