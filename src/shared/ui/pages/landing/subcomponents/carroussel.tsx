"use client";

type ItemType = {
  date: string;
  text: string;
  id: string;
};

type CarouselProps = { user: string, items: ItemType[] };

type CarouselItemProps = {
  user: string;
  text: string;
  id: string;
  date: string;
  width: number;
  height: number;
  margin: number;
};

const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 100;
const ITEM_MARGIN = 20;
const PIXELS_PER_SECOND = 40;
const WINDOW_WIDTH_CLASS= "w-30"

const Carousel = ({ user, items }: CarouselProps) => {
  const trackWidth = (ITEM_WIDTH + ITEM_MARGIN) * items.length;
  const duration = trackWidth / PIXELS_PER_SECOND;

  return (
    <div className={`overflow-hidden ${WINDOW_WIDTH_CLASS}`}>
      <div
        className="flex"
        style={{
          width: `${trackWidth * 2}px`,
          animation: `scroll ${duration}s linear infinite`,
        }}
      >
        {items.map((item, index) => (
          <CarouselItem
            user={user}
            text={item.text}
            date={item.date}
            id={item.id}
            key={`SET_A_${index}`}
            width={ITEM_WIDTH}
            height={ITEM_HEIGHT}
            margin={ITEM_MARGIN}
          />
        ))}
        {items.map((item, index) => (
          <CarouselItem
            user={user}
            text={item.text}
            date={item.date}
            id={item.id}
            key={`SET_B_${index}`}
            width={ITEM_WIDTH}
            height={ITEM_HEIGHT}
            margin={ITEM_MARGIN}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-${trackWidth}px); }
        }
      `}</style>
    </div>
  );
};


const CarouselItem = ({ user, text, id, date, width, height, margin }: CarouselItemProps) => {
  const url = `https://x.com/${user}/status/${id}`;

return (
<a href={url} target="_blank" rel="noopener noreferrer">
<div className="p-2 bg-zinc-50 rounded text-emerald-900 flex overflow-hidden"
style={{
  width: `${ITEM_WIDTH}px`,
  height: `${ITEM_HEIGHT}px`,
  marginRight: `${ITEM_MARGIN}px`,
}}
>
    <div className="flex flex-col">
        <div className="text-[10px] font-extrabold  tracking-wide">{date}</div>
  <p 
  
  lang="pt"
  className="italic leading-4 break-words hyphens-auto line-clamp-[4] text-ellipsis text-[10px] font-semibold tracking-wide">
    {text}
  </p>

  </div>
</div>
</a>)

};

export default Carousel;