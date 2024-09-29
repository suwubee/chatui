'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Settings, Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

const models = [
  { value: 'gpt-4o-mini', label: 'GPT-4O Mini' },
  { value: 'gpt-4o', label: 'GPT-4O' },
  { value: 'gpt-4o-2024-08-06', label: 'GPT-4O (2024-08-06)' },
]

export default function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiUrl, setApiUrl] = useState('https://chatapi.aisws.com/v1/chat/completions')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [historyCount, setHistoryCount] = useState(6)
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState('')
  const scrollAreaRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setError('')

    const newUserMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, newUserMessage])
    setInput('')
    setIsLoading(true)

    try {
      let userContent = input
      if (historyCount > 0) {
        const historyMessages = messages.slice(-historyCount)
        if (historyMessages.length > 0) {
          const historyContent = historyMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
          userContent = `${historyContent}\nuser: ${input}`
        }
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "system",
              content: "You are an assistant. Support markdown and workflow formats in your responses."
            },
            {
              role: "user",
              content: userContent
            }
          ]
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices[0].message.content

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }])
    } catch (error) {
      console.error('Error:', error)
      setError(`An error occurred: ${error.message}. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e)
    }
  }

  const renderMessage = (message) => {
    if (message.role === 'user') {
      return <p>{message.content}</p>
    }
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {message.content}
      </ReactMarkdown>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4">
            {messages.map((message, index) => (
              <Card key={index} className={`mb-4 ${message.role === 'user' ? 'bg-blue-100' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <p className="font-semibold mb-2">{message.role === 'user' ? 'You' : 'AI'}</p>
                  {renderMessage(message)}
                </CardContent>
              </Card>
            ))}
            {error && (
              <Card className="mb-4 bg-red-100">
                <CardContent className="p-4">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}
          </ScrollArea>
        </div>
        <div className="p-4 bg-white">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="w-full"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Press Ctrl+Enter to send</p>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Send
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className="w-64 bg-gray-200 p-4">
        <Button onClick={() => setShowSettings(!showSettings)} className="mb-4 w-full">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        {showSettings && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select id="model" value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="historyCount">Number of chat history messages to include</Label>
              <Input
                id="historyCount"
                type="number"
                value={historyCount}
                onChange={(e) => setHistoryCount(Number(e.target.value))}
                min={0}
                max={20}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}