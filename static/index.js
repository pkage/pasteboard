window.onload = () => {
    const editor = ace.edit('ace')
    editor.setTheme('ace/theme/twilight')
    editor.session.setMode('ace/mode/javascript')

    editor.setOptions({
        fontFamily: 'var(--font-family)',
        fontSize: 'var(--font-size)'
    })

    editor.session.selection.on('changeSelection', e => {
        const text = editor.getSelectedText()
        let count
        if (text === '') {
            count = 0
        } else {
            count = text.split('\n').length
        }
        document.querySelector('#linecount').textContent = count
    })


    window.editor = editor
}

document.querySelector('#sendlines')
    .addEventListener('click', async () => {
        const text = editor.getSelectedText()

        const res = await fetch('/api/copy', {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({text})
        })

        const body = await res.json()

        if (body.success) {
            let el = document.querySelector('#sendlines')
            el.classList.add('success')
            setTimeout(() => el.classList.remove('success'), 250)
        }

    })
