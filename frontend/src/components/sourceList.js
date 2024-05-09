import { NavArrowDown, NavArrowUp} from 'iconoir-react';
import { useState } from 'react';

export default function SourceList({sources=[]}) {

    const [sourcesOpen, setSourcesOpen] = useState(false)

    return <div>
        <div className='flex flex-row'>
        <div className='flex text-lg cursor-pointer w-fit  font-bold mt-2' onClick={() => {setSourcesOpen(!sourcesOpen)}}>
            Sources <div className='w-10 h-10 pt-0.5'>{sourcesOpen ?   <NavArrowUp/> : <NavArrowDown />}</div>
        </div>
        <button className={"h-10 bg-zinc-500 hover:bg-zinc-600 text-white font-semibold py-1 px-2 rounded-none focus:outline-none focus:shadow-outline rounded-md w-fit ml-auto my-auto"}
        onClick={()=>window.location.reload()}>Try another product</button>
        </div>
{sources.length > 0 && sourcesOpen? <>
                        {sources.map((source, indx) => (

                                
                            <div key={indx} className='mx-auto bg-zinc-700 my-6 px-4 py-2 rounded-none whitespace-pre-line'>
                               <span className="text-lg font-medium">Source #{indx+1} ({source['type'] === 'review' ? `${source['rating']}* Review`: 'Q&A'})<br></br></span>{source['text']}
                            </div>))}
                    </> : <></>}
    </div>
}
