import re

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern pour trouver et supprimer le doublon (lignes 734-743)
pattern = r'\n    // Handle Photo Catalyst completion\n    const handlePhotoCatalystComplete = async \(result: PhotoCatalystResult\) => \{\n        setShowPhotoCatalyst\(false\);\n        \n        // Auto-send the generated prompt to Plume\n        if \(result\.generatedPrompt\) \{\n            await triggerSend\(result\.generatedPrompt, result\.photo\.url\);\n            showToast\("Photo analysée ! Plume rédige votre souvenir\.\.\.

", \'success\'\);\n        \}\n    \};\n'

content = re.sub(pattern, '', content, count=1)

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Doublon supprimé !")
