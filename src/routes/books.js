const express = require('express')
const router  =  express.Router()
const library = require('./../models/library')
const fileMulter = require('./../middleware/file')
const PORT_REIDS = process.env.PORT_REIDS || 3002
const http = require('http')
const { error } = require('console')

router.get('/', async (req, res) => {    
    
    const books = await library.find()
    //Перенесем список кни в массив который ожидает api counter
    const mBooks = []
    for (let book of books) {
        mBooks.push({id: book._id})
    }

    //Получим просмотры для для каждой книги:
    const url = `http://counter:${PORT_REIDS}/counters`    
    try {
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(mBooks)
        })
        let counter = 0
        if (response.ok) {
            const responce  = await response.json()
            //Полученные просмотры находятся в массиве responce.mBooksCounters, перенесем их в массив book:
            for (let bookId of responce.mBooksCounters) {
                let curBook = books.find(item => item._id == bookId.id)
                curBook.counter = `Просмотры: ${ +bookId.counter }`
            }
            
        } else {
            console.log("Ошибка HTTP: " + response.status);
        }
    }
    catch {
        let counter = 0
    }

    res.render('books/index',{
        title: "Books",
        books: books,
    })
})

router.get('/create', (req, res) => {
    res.render("books/create", {
        title: "Создание книги:",
        book: {},
    })
})

router.post('/create', async (req, res) => {

    const {title, description, authors, favorite, fileCover} = req.body
    const book = new library({
        title, description, authors, favorite, fileCover
    });

    try {
        await book.save();
        res.redirect('/book')
    } catch (e) {
        console.error(e);
    }
    
})

router.get('/:id', async (req, res) => {    

    const {id} = req.params;
    let book
    //Получим объект книги:
    try {
        book = await library.findById(id)
    } catch (e) {
        console.error(e)
        res.status(404).redirect('/404')
    }    
    //Получим количество просмотров текущей кники
    const url = `http://counter:${PORT_REIDS}/counter/${id}`
    let counter = 0
    try {        
        let response = await fetch(url, {
            method: 'POST'
        })
        if (response.ok) {
            const responce  = await response.json()
            counter = responce.counter
        } else {
            console.log("Ошибка HTTP: " + response.errmsg);
        }
    }
    catch (e) {     
        console.error(e)         
        res.render("books/view", {
            title: "Книга.:",
            book: book,
            counter: `Количество просмотров: ${+counter}`
        })
    }

    res.render("books/view", {
        title: "Книга:",
        book: book,
        counter: `Количество просмотров: ${+counter}`,
    })
})

router.get('/update/:id', async (req, res) => {

    const {id} = req.params;
    let book
    try {
        book = await library.findById(id);
    } catch (e) {
        console.error(e);
        res.status(404).redirect('/404');
    }

    res.render("books/update", {
        title: "Изменение книги:",
        book: book,
    })
})

router.post('/update/:id', async (req, res) => {
    /*const {book} = library.books
    const {title, description, authors, favorite, fileCover} = req.body
    const {id}     = req.params
    const idx = book.findIndex(el => el.id === id)
        
    if (idx !== -1){
        book[idx] = {
            ...book[idx],
            title,
            description,
            authors,
            favorite,
            fileCover
            }
        res.redirect(`/book/${id}`);
    } else {
        res.status(404).redirect('/404');
    }*/
    const {id} = req.params;
    const {title, description, authors, favorite, fileCover} = req.body;

    try {
        await library.findByIdAndUpdate(id, {title, description});
    } catch (e) {
        console.error(e);
        res.status(404).redirect('/404');
    }

    res.redirect(`/book/${id}`);
})

router.post('/delete/:id', async (req, res) => {

    const {id} = req.params;

    try {
        await library.deleteOne({_id: id});
    } catch (e) {
        console.error(e);
        res.status(404).redirect('/404');
    }

    res.redirect(`/book`)
})

module.exports = router