import PropTypes from "prop-types"
import { Icon } from "@iconify/react"

/*
  ProjectCards
  - Responsive grid of cards for showcasing project areas or offerings.
  - Designed to match the radial hover fill pattern you used in channels.

  Props:
  - items: Array<{ title: string, description?: string, icon?: string, href?: string }>
  - isDark?: boolean
  - columns?: { base?: number, md?: number, lg?: number }
  - className?: string (extra classes for the grid container)

  Usage:
    <ProjectCards
      isDark={isDark}
      items={[
        { title: 'Metodológicas', description: 'Buenas prácticas, disciplina y gobierno de datos', icon: 'ph:target-duotone', href: '#' },
        { title: 'Funcionales', description: 'Diseño funcional alineado al negocio', icon: 'ph:rocket-launch-duotone', href: '#' },
      ]}
    />
*/

const ProjectCards = ({ items = [], isDark = false, columns, className = "" }) => {
  const cols = {
    base: columns?.base ?? 1,
    md: columns?.md ?? 2,
    lg: columns?.lg ?? 3,
  }

  return (
    <div
      className={[
        "grid gap-4",
        `grid-cols-${cols.base}`,
        `md:grid-cols-${cols.md}`,
        `lg:grid-cols-${cols.lg}`,
        className,
      ].join(" ")}
    >
      {items.map((item, idx) => {
        const Tag = item.href ? "a" : "div"
        const tagProps = item.href ? { href: item.href, target: item.target || "_self", rel: item.rel || undefined } : {}
        return (
          <Tag
            key={idx}
            {...tagProps}
            className={`
              group relative block overflow-hidden rounded-md border p-4
              transition-[background-size,color,transform,border-color] duration-300 ease-out
              hover:-translate-y-[2px]
              ${isDark
                ? "border-cloud/40 text-white hover:text-primary [--fill:theme(colors.cloud)]"
                : "border-primary/40 text-black hover:text-secondary [--fill:theme(colors.primary)]"
              }
              bg-[radial-gradient(circle_at_center,var(--fill)_0%,var(--fill)_100%)]
              bg-no-repeat bg-center [background-size:0%_0%]
              hover:[background-size:160%_160%]
            `}
          >
            <div className="relative z-10 flex items-start gap-3">
              {item.icon && (
                <div className="shrink-0 rounded-md border px-2 py-2
                                transition-colors duration-200
                                border-current/30">
                  <Icon icon={item.icon} width="24" height="24" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-specs text-lg md:text-xl font-semibold leading-tight">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 text-sm md:text-base opacity-90">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
            {item.href && (
              <div className="relative z-10 mt-3 inline-flex items-center gap-1 text-xs md:text-sm font-specs opacity-90">
                <span>ver más</span>
                <span aria-hidden>↗</span>
              </div>
            )}
          </Tag>
        )
      })}
    </div>
  )
}

ProjectCards.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string, // Iconify name, e.g., 'ph:target-duotone'
    href: PropTypes.string,
    target: PropTypes.string,
    rel: PropTypes.string,
  })).isRequired,
  isDark: PropTypes.bool,
  columns: PropTypes.shape({
    base: PropTypes.number,
    md: PropTypes.number,
    lg: PropTypes.number,
  }),
  className: PropTypes.string,
}

export default ProjectCards
