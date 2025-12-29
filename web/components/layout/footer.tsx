/**
 * Footer Component
 */

import Link from 'next/link';
import { Github, Twitter, ExternalLink } from 'lucide-react';
import { EXTERNAL_LINKS, CURRENT_CHAIN } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-mnee-500 to-purple-600">
                <span className="text-xs font-bold text-white">M</span>
              </div>
              <span className="font-semibold">MeneeMart</span>
            </div>
            <p className="mt-2 text-center text-sm text-muted-foreground md:text-left">
              Pay-to-Decrypt Web3 Marketplace
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link
              href={EXTERNAL_LINKS.etherscan[CURRENT_CHAIN]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              Etherscan
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href={EXTERNAL_LINKS.safe}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              Safe
              <ExternalLink className="h-3 w-3" />
            </Link>
            <Link
              href={EXTERNAL_LINKS.splits}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              Splits
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} MeneeMart. Built for MNEE Hackathon.</p>
        </div>
      </div>
    </footer>
  );
}

