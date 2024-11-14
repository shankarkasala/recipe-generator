const express = require('express');
const cors = require('cors');
const OpenAi = require('openai');

const app = express()
const PORT = 3001

app.get('/recipeStream', (req, res) => {
    const ingrediants = req.query.ingredients;
    const mealType = req.query.mealType;
    const cusine = req.query.cusine;
    const cookingTime = req.query.cookingTime
    const complexity = req.query.complexity;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive')

    const sendEvent = (chunk) => {
        let chunkRes;
        if (chunk.choices[0].finish_reason === "stop") {
            res.write(`data: ${JSON.stringify({ action: 'close' })}\n\n`)
        } else {
            if (chunk.choices[0].delta.role && chunk.choices[0].delta.role === 'assistant') {
                chunkRes = {
                    action: 'start'
                }
            } else {
                chunkRes = {
                    action: 'chunk',
                    chunk: chunk.choices[0].delta.content
                }
            }
            res.write(`data: ${JSON.stringify(chunkRes)}\n\n`)
        }
    }
    const prompt = []
    prompt.push('generate a recipe that incorporate the following details:');
    prompt.push(`[ingredients: ${ingrediants}]`)
    prompt.push(`[mealType: ${mealType}]`)
    prompt.push(`[cusine: ${cusine}]`)
    prompt.push(`[cookingTime: ${cookingTime}]`)
    prompt.push(`[complexity: ${complexity}]`)
    prompt.push('please provide a detailed recipe, including steps for preparartion and cooking. only use the ingredints.')
    prompt.push('The recipe should highlight the fresh and vibrant flavours of the ingredients.')
    prompt.push('Also give the recipe a suiable name in its local language based on cusine preference.')

    const messages = [
        {
            role: 'system',
            content: prompt.join(' ')
        }
    ]

    fetchOpenAiCompletionStream(messages, sendEvent);

    req.on('close', () => {
        res.end()
    })
})


async function fetchOpenAiCompletionStream(message, callback) {
    const OPEN_API_KEY = '';
    const openai = new OpenAi({ apiKey: OPEN_API_KEY });
    const aiModel = 'gpt-4-1106-preview';

    try {
        const completion = openai.chat.completions.create({
            model: aiModel,
            message: message,
            Stream: true,
        })

        for await (const chunk of completion) {
            callback(chunk)
        }
    } catch (err) {
        console.log(err)
    }
}

app.listen(PORT, () => {
    console.log(`server running on the port ${PORT}`)
})