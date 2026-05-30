import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'hot-toast',
            style: {
              background: 'hsl(222, 22%, 12%)',
              color: 'hsl(220, 20%, 94%)',
              border: '1px solid hsl(220, 15%, 20%)',
              borderRadius: '10px',
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: 'hsl(142, 71%, 45%)', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: 'hsl(0, 84%, 60%)', secondary: 'white' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
