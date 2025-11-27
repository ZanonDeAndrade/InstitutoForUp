from pathlib import Path 
p=Path(\"src/pages/AdminPanel.tsx\") 
text=p.read_text() 
text=text.replace(\"max-w-6xl\",\"max-w-7xl\") 
p.write_text(text) 
