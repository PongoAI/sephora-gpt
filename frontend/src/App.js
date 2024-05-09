import React from 'react';
import SearchBar from "./components/searchBar";
import { Heptagon } from "./components/heptagon";
import SourceList from './components/sourceList';
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'


const SOCKET_URL = 'wss://smpl-backend.joinpongo.com/sockets/sephora'


const ID_TO_PRODUCT_INFO = {
  'P454380': {
    'url': 'https://www.sephora.com/product/supergoop-unseen-sunscreen-spf-40-P454380',
    'name': 'Unseen Sunscreen Invisible Broad Spectrum SPF 40',
    'img': 'https://www.sephora.com/productimages/sku/s2315935-main-zoom.jpg',
    'id': 'P454380'
  },
  'P468206': {
    'url': 'https://www.sephora.com/product/saie-glowy-super-gel-lightweight-dewy-highlighter-P468206',
    'name': 'Glowy Super Gel Lightweight Dewy Multipurpose Illuminator',
    'img': 'https://www.sephora.com/productimages/sku/s2414027-main-zoom.jpg',
    'id': 'P468206'
  },
  'P88779809': {
    'url': 'https://www.sephora.com/product/pro-filt-r-instant-retouch-concealer-P88779809',
    'name': 'Pro Filtr Instant Retouch Longwear Liquid Concealer',
    'img': 'https://www.sephora.com/productimages/sku/s2173367-main-zoom.jpg',
    'id': 'P88779809'
  },
  'P411540': {
    'url': 'https://www.sephora.com/product/cicapair-tiger-grass-color-correcting-treatment-spf-30-P411540',
    'name': 'Cicapair™ Tiger Grass Color Correcting Treatment SPF 30',
    'img': 'https://www.sephora.com/productimages/sku/s1855709-main-zoom.jpg',
    'id': 'P411540'
  } 
}


export default function App() {
  const baseResults = [{placeholder: true}, {placeholder: true}, {placeholder: true}, {placeholder: true}]
  const [pageState, setPageState] = React.useState('landing')
  const [pageTitle, setPageTitle] = React.useState('')
  const [sources, setSources] = React.useState(baseResults)
  const [socket, setSocket] = React.useState(null)

  const [answer, setAnswer] = React.useState('')

  const [socketReady, setSocketReady] = React.useState(false)
  const [SocketHasClosed, setSocketHasClosed] = React.useState(false)

  const [productID, setProductID] = React.useState('NONE')

const checkSocketsReady = (inputSocket) => {
        if (inputSocket.readyState === WebSocket.OPEN) {
          setSocketReady(true);
        }
    };




    console.log(productID)
  React.useEffect(() => {
      const newSocket = new WebSocket(SOCKET_URL);

      newSocket.onopen = () => checkSocketsReady(newSocket);


      newSocket.onmessage = (event) => {
          if (event.data.startsWith("JSON_STRING:")) {

              const data = JSON.parse(event.data.substring("JSON_STRING:".length));
              console.log(data)
              setSources(data);
          } else {

              setAnswer((prev) => prev + event.data);
          }
      };
      const handleClose = () => {
        setSocketHasClosed(true)
      };
  
      newSocket.onclose = handleClose;
      
      setSocket(newSocket);

  }, [setSocket]);

  const handleSearch = async (e, queryString) => {
    e.preventDefault()
    if (!socket || socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
      console.log('que')
      setSocketHasClosed(true)
      return
    }

    if(queryString === '') {
      return
    } else {
      setSources(baseResults)
      setPageTitle(queryString)
      setPageState('results')
      setAnswer('')

      if(socket) {
        socket.send(JSON.stringify({'query': queryString, 'product_id': productID}))
      } else {
        alert('connection to server lost, please refresh page')
      }
    }
    

  }

  return (
    <div className="min-h-screen h-fit w-screen bg-zinc-900 flex flex-col px-5 text-white">
      <div className="flex pt-5 md:pt-3">
        <div className="mt-auto text-sm"><a href='https://github.com/PongoAI/sephora-gpt' className="underline">View source code</a></div>
        <div className="ml-auto ">An experiment by <a href='https://joinpongo.com?utm_source=sephoraGPT' className="underline">Pongo 🦧</a></div>
      </div>
        

      {pageState === 'landing' ? 
      <div className="flex flex-col h-fit">

        <div className="mx-auto text-3xl mt-10 md:mt-20 w-fit">Pick a product, then chat with its reviews</div>
        <div className='grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-0 mt-10 mx-auto'>

       
        <div className={'text-center cursor-pointer rounded-md w-fit h-fit p-2 ' + (productID === 'P411540' ? 'border-2 border-indigo-500 text-indigo-600 shadow-indigo-500 shadow' : '')} onClick={() => {setProductID('P411540')}}>
          
          <img 
        className='max-w-36 mx-auto '
        src={'https://www.sephora.com/productimages/sku/s1855709-main-zoom.jpg'} 
        alt="Product" />
        Liquid Concealer...</div>
        
        <div className={'text-center cursor-pointer rounded-md w-fit h-fit p-2 ' + (productID === 'P88779809' ? 'border-2 border-indigo-500 text-indigo-600 shadow-indigo-500 shadow' : '')} onClick={() => {setProductID('P88779809')}}>

          <img 
        className='max-w-36 mx-auto '
        src={'https://www.sephora.com/productimages/sku/s2173367-main-zoom.jpg'} 
        alt="Color correcting..." />Color correcting treatment...</div>
        

        <div className={'text-center cursor-pointer rounded-md w-fit h-fit p-2 ' + (productID === 'P468206' ? 'border-2 border-indigo-500 text-indigo-600 shadow-indigo-500 shadow' : '')} onClick={() => {setProductID('P468206')}}>

          <img 
        className='max-w-36 mx-auto '
        src={'https://www.sephora.com/productimages/sku/s2414027-main-zoom.jpg'} 
        alt="Product" />Glowy Multipurpose Illuminator... </div>
        
        <div className={'text-center cursor-pointer rounded-md w-fit h-fit p-2 ' + (productID === 'P454380' ? 'border-2 border-indigo-500 text-indigo-600 shadow-indigo-500 shadow' : '')} onClick={() => {setProductID('P454380')}}>
          <img 
        className='max-w-36 mx-auto '
        src={'https://www.sephora.com/productimages/sku/s2315935-main-zoom.jpg'} 
        alt="Product" />Supergoop 40SPF Sunscreen</div>
      </div>

        <div className="w-full mt-5 md:mt-10 mb-10">
          <SearchBar isPill={false} handleSearch={handleSearch} shouldWarn={SocketHasClosed} shouldBlur={SocketHasClosed || !socketReady || productID === 'NONE'}/>
        </div> 
      </div>
      
      :

      <div className="max-w-[50rem] w-full mx-auto">

        <div className="mx-auto text-3xl mt-10">{pageTitle}</div>


        <img 
        className='max-w-40 mx-auto mt-8'
        src={ID_TO_PRODUCT_INFO[productID]['img']} 
        alt="Product" />
        <div className='text-center mt-1 underline'><a href={ID_TO_PRODUCT_INFO[productID]['url']} target='_blank' rel="noreferrer">{ID_TO_PRODUCT_INFO[productID]['name']}</a></div>

        <div className="flex mt-8 text-lg font-semibold">
          <div className="my-auto mr-2 w-[1.4rem] h-[1.4rem]"><Heptagon/></div>
          Answer
        </div>


        <div className="mt-1 whitespace-pre-wrap"><ReactMarkdown
                            remarkPlugins={[remarkGfm]}

                            components={{
                                // Use Tailwind CSS classes to style the HTML elements
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-4 text-zinc-50" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-medium my-3 text-zinc-50" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-xl my-2 text-zinc-50" {...props} />,
                                h4: ({ node, ...props }) => <h4 className="text-lg font-medium my-1 text-zinc-50" {...props} />,
                                h5: ({ node, ...props }) => <h5 className="text-sm font-medium text-zinc-50" {...props} />,
                                h6: ({ node, ...props }) => <h6 className="text-xs font-medium  text-zinc-50" {...props} />,
                                p: ({ node, ...props }) => <p className="text-base my-2 text-white font-light" {...props} />,

                                a: ({ node, ...props }) =>
                                    <a target='_blank' className="text-zinc-50 font-mono hover:text-zinc-100 underline" {...props} />,


                                ul: ({ node, ...props }) => <ul className="list-disc pl-6 text-white font-light" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 text-white font-light" {...props} />,
                                li: ({ node, ...props }) => <li className="pl-1 py-0.5 font-light" {...props} />,
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 pl-4 italic my-4 bg-zinc-800 text-zinc-100" {...props} />,
                                code: ({ node, ...props }) => <code className="py-1 rounded text-sm font-mono bg-zinc-800 text-zinc-100" {...props} />,
                                pre: ({ node, ...props }) => <pre className="py-2 px-4 rounded text-sm bg-zinc-800 text-zinc-100 overflow-x-auto" {...props} />,
                            }} >
          
          {answer === '' ? 'loading...': answer}
          
          </ReactMarkdown></div>

          <div className='mt-6 mb-40'>
          <SourceList sources={sources} />
          </div>
        


          <SearchBar isPill={true} handleSearch={handleSearch} shouldWarn={SocketHasClosed} shouldBlur={SocketHasClosed || !socketReady}/>

        </div>
        
        }



    </div>
  );
}
