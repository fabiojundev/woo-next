import client from '../../src/apollo/client';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import Layout from '../../src/components/Layout';
import { FALLBACK, handleRedirectsAndReturnData } from '../../src/utils/slug';
import { GET_POST } from '../../src/queries/posts/get-post';
import { GET_POST_SLUGS } from '../../src/queries/posts/get-posts';
import { sanitize } from '../../src/utils/miscellaneous';
import Image from '../../src/components/image';

const Post = ({ data }) => {
	const router = useRouter();

	// If the page is not yet generated, this will be displayed
	// initially until getStaticProps() finishes running
	if (router.isFallback) {
		return <div>Loading...</div>;
	}

	return (
		<Layout data={data} isPost>
			<figure className="overflow-hidden mb-4">
				<Image {...data?.post?.featuredImage?.node} width="400" height="225" layout="fill" containerClassNames="w-96 sm:-w-600px md:w-400px h-56 sm:h-338px md:h-225px" title={data?.post?.title ?? ''} />
			</figure>
			<h1 className="font-bold mb-3 text-lg hover:text-blue-500" dangerouslySetInnerHTML={{ __html: sanitize(data?.post?.title ?? '') }} />

			<div dangerouslySetInnerHTML={{ __html: sanitize(data?.post?.content ?? {}) }} />
		</Layout>
	);
};

export default Post;

export async function getStaticProps({ params }) {
	const { data, errors } = await client.query({
		query: GET_POST,
		variables: {
			uri: params?.slug ?? '/',
		},
	});

	const defaultProps = {
		props: {
			data: data || {}
		},
		/**
		 * Revalidate means that if a new request comes to server, then every 1 sec it will check
		 * if the data is changed, if it is changed then it will update the
		 * static file inside .next folder with the new data, so that any 'SUBSEQUENT' requests should have updated data.
		 */
		revalidate: 1,
	};

	return handleRedirectsAndReturnData(defaultProps, data, errors, 'post');
}

/**
 * Since the page name 'does not' use catch-all routes,
 * for example [slug],
 * that's why params would contain just slug and not an array of slugs , unlike [...slug].
 * For example, If we need to have dynamic route '/foo/'
 * Then we would add paths: [ params: { slug: 'foo' } } ]
 * Here slug will be 'foo', then Next.js will statically generate the page at /foo/
 *
 * At build time next js will will make an api call get the data and
 * generate a page bar.js inside .next/foo directory, so when the page is served on browser
 * data is already present, unlike getInitialProps which gets the page at build time but makes an api
 * call after page is served on the browser.
 *
 * @see https://nextjs.org/docs/basic-features/data-fetching#the-paths-key-required
 *
 * @returns {Promise<{paths: [], fallback: boolean}>}
 */
export async function getStaticPaths() {
	const { data } = await client.query({
		query: GET_POST_SLUGS
	});

	const pathsData = [];

	data?.posts?.nodes && data?.posts?.nodes.map(post => {
		if (!isEmpty(post?.slug)) {
			pathsData.push({ params: { slug: post?.slug } });
		}
	});

	return {
		paths: pathsData,
		fallback: FALLBACK
	};
}
