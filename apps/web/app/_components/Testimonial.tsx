import Image from "next/image";
import { Icon } from "@iconify/react";
import defaultUserImg from "../../public/default-user.jpg";

type TestimonialProps = {
  name: string;
  rating: number;
  text: string;
  image: string;
};

function Testimonial({ name, rating, text, image }: TestimonialProps) {
  const stars = [];
  const isDecimal = rating % 2 === 1;

  for (let i = 1; i <= 10; i += 2) {
    if (i < rating) {
      stars.push("line-md:star-filled");
    }

    if (isDecimal && i === rating) {
      stars.push("line-md:star-half-filled");
      stars.push("line-md:star-right-half-twotone");
    }

    if (i > rating) {
      stars.push("line-md:star-twotone");
    }
  }

  return (
    <div className="inline-flex min-w-[15.1rem] shrink-0 items-center gap-2 rounded-xl border border-gray-200 p-1">
      <Image
        src={image || defaultUserImg}
        height={25}
        width={25}
        alt={`Image of ${name}`}
        className="inline-block max-h-10 min-h-10 max-w-10 min-w-10 rounded-full"
      />
      <div>
        <div className="flex items-center gap-2">
          <span className="text-base text-nowrap">{name}</span>
          <div className="flex text-yellow-400">
            {stars.map((icon, i) => (
              <Icon
                key={i}
                icon={icon}
                className={`${(icon === "line-md:star-right-half-twotone" || icon === "line-md:star-twotone") && isDecimal && "-translate-x-[100%]"}`}
              />
            ))}
          </div>
        </div>

        <p className="text-sm text-nowrap">{text}</p>
      </div>
    </div>
  );
}

export default Testimonial;
