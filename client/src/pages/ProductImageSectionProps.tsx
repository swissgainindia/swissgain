interface ProductImageSectionProps {
  images: string[];
  name: string;
  discount?: number;
  selectedIndex: number;
  onSelectImage: (index: number) => void;
}

export default function ProductImageSection({
  images,
  name,
  discount,
  selectedIndex,
  onSelectImage,
}: ProductImageSectionProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <img
          src={images[selectedIndex]}
          alt={`${name} main view`}
          className="rounded-xl shadow-lg w-full h-96 object-cover"
        />
        {discount && (
          <div className="inline-flex items-center rounded-full border transition-colors border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 absolute top-4 left-4 font-semibold text-lg px-3 py-1">
            {discount}% OFF
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${name} view ${index + 1}`}
              className={`rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow h-20 object-cover ${
                selectedIndex === index ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectImage(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
